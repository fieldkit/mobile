import _ from "lodash";
import { FileType } from "@/store/types";
import { serializePromiseChain } from "@/utilities";

import protobuf from "protobufjs";

const dataRoot = protobuf.Root.fromJSON(require("fk-data-protocol"));
const PbDataRecord = dataRoot.lookupType("fk_data.DataRecord");
const PbSignedRecord = dataRoot.lookupType("fk_data.SignedRecord");

export class Time {
    public static Max = 8640000000000000;
    public static Min = -8640000000000000;
}

export interface DataRecord {
    readings: { meta: number; reading: number; time: number };
}

export interface ParsedDataRecord {
    type: FileType;
    record: number;
    time: number;
    parsed: DataRecord;
}

class FileRecords {
    constructor(public readonly first: number, public readonly last: number, public readonly total: number) {}
}

class FileTimes {
    constructor(public readonly start: number, public readonly end: number) {}
}

export class FileInfo {
    constructor(public readonly records: FileRecords, public readonly times: FileTimes) {}
}

export class DataWalkParams {
    constructor(public readonly start: number, public readonly end: number) {}
}

type ParseFunc = (buffer: Buffer) => ParsedDataRecord;

interface SignedRecord {
    record: number;
    time: number;
    data: string;
}

function parseDataRecord(buffer: Buffer): ParsedDataRecord {
    const parsed = PbDataRecord.decode(buffer) as any;
    if (parsed.readings?.reading === undefined) {
        throw new Error(`no reading number: JSON.stringify(parsed)`);
    }
    return {
        type: FileType.Data,
        time: parsed.readings.time,
        record: parsed.readings.reading,
        parsed: parsed,
    };
}

function parseMetaRecord(buffer: Buffer): ParsedDataRecord {
    const signed = (PbSignedRecord.decode(buffer) as unknown) as SignedRecord;
    const parsed = PbDataRecord.decodeDelimited(Buffer.from(signed.data, "base64")) as any;
    return {
        type: FileType.Meta,
        time: signed.time,
        record: signed.record,
        parsed: parsed,
    };
}

interface ConservifyFile {
    delimited(any): Promise<any>;
}

interface Conservify {
    open(path: string): Promise<ConservifyFile>;
}

type ServiceFunc = () => Conservify;

interface DataVisitor {
    onData(data: ParsedDataRecord, meta: ParsedDataRecord): void;
}

interface ParsedRecordVisitor {
    onRecord(data: Buffer, record: ParsedDataRecord): boolean;
}

interface RawRecordVisitor {
    onRecord(data: Buffer, parse: ParseFunc): boolean;
}

class RecordsInfoVisitor implements RawRecordVisitor {
    private first: ParsedDataRecord | null = null;
    private last: ParsedDataRecord | null = null;
    private times: { start: number | null; end: number | null } = { start: null, end: null };
    private total: number = 0;

    public onRecord(data: Buffer, parse: ParseFunc): boolean {
        const parsed = parse(data);
        if (this.times.start === null || parsed.time < this.times.start) {
            this.times.start = parsed.time;
        }
        if (this.times.end === null || parsed.time > this.times.end) {
            this.times.end = parsed.time;
        }
        if (this.first == null) {
            this.first = parsed;
        }
        this.last = parsed;
        this.total += 1;
        return true;
    }

    public get(): FileInfo {
        if (!this.last || !this.first || !this.times.start || !this.times.end) {
            throw new Error(`no records in file`);
        }
        const records = new FileRecords(this.first.record, this.last.record, this.total);
        return new FileInfo(records, new FileTimes(this.times.start * 1000, this.times.end * 1000));
    }
}

class ParseRecordsVisitor implements RawRecordVisitor {
    constructor(private readonly visitor: ParsedRecordVisitor) {}

    public onRecord(data: Buffer, parse: ParseFunc): boolean {
        return this.visitor.onRecord(data, parse(data));
    }
}

class ReturnAllParsedRecords implements RawRecordVisitor {
    public readonly records: ParsedDataRecord[] = [];

    public onRecord(data: Buffer, parse: ParseFunc): boolean {
        this.records.push(parse(data));
        return true;
    }
}

class DataFile {
    constructor(private readonly services: ServiceFunc, public readonly path: string, public readonly type: FileType) {}

    public analyze(): Promise<FileInfo> {
        return this.walkRaw(new RecordsInfoVisitor()).then((visitor) => visitor.get());
    }

    public walkRecords<T extends ParsedRecordVisitor>(visitor: T): Promise<T> {
        return this.walkRaw(new ParseRecordsVisitor(visitor)).then((rawVisitor) => visitor);
    }

    private walkRaw<T extends RawRecordVisitor>(visitor: T): Promise<T> {
        console.log("walk-raw:walking", this.path);
        const started = new Date();
        const parseFunction = this.parseFunction;
        return this.services()
            .open(this.path)
            .then((file) => {
                return file
                    .delimited((position, size, records) => {
                        for (let i = 0; i < records.size(); ++i) {
                            const buffer = Buffer.from(records.get(i), "base64");
                            try {
                                if (!visitor.onRecord(buffer, parseFunction)) {
                                    // TODO Stop!
                                }
                            } catch (e) {
                                console.log(`error handling raw record: ${e.message}`);
                            }
                        }
                    })
                    .then(() => {
                        const done = new Date();
                        const elapsed = done.getTime() - started.getTime();
                        console.log("walk-raw:done", this.path, elapsed);
                        return visitor;
                    });
            });
    }

    private get parseFunction(): ParseFunc {
        switch (this.type) {
            case FileType.Meta:
                return parseMetaRecord;
            case FileType.Data:
                return parseDataRecord;
        }
        throw new Error(`undefined type: ${this.type}`);
    }

    private allRecords: Promise<ParsedDataRecord[]> | null = null;

    private cache(): Promise<ParsedDataRecord[]> {
        if (!this.allRecords) {
            console.log("data-file:caching", this.path);
            this.allRecords = this.walkRaw(new ReturnAllParsedRecords()).then((visitor) => visitor.records);
        }
        return this.allRecords;
    }

    public find(record: number): Promise<ParsedDataRecord> {
        return this.cache().then((records) => {
            const matching = records.filter((r) => r.record == record);
            if (matching.length != 1) {
                throw new Error(`unable to find record #${record} ${this.path}`);
            }
            return matching[0];
        });
    }
}

function getPathFileType(path: string): FileType {
    if (/data\.fkpb/.test(path)) {
        return FileType.Data;
    }
    if (/meta\.fkpb/.test(path)) {
        return FileType.Meta;
    }
    throw new Error(`unable to get file type: ${path}`);
}

class StatisticsDataVisitor implements DataVisitor {
    constructor(public visited: number = 0) {}

    public onData(data: ParsedDataRecord, meta: ParsedDataRecord): void {
        this.visited++;
    }
}

interface MetaLoader {
    loadMeta(record: number): Promise<ParsedDataRecord>;
}

class LoadMetaVisitor implements ParsedRecordVisitor {
    constructor(public readonly loader: MetaLoader, public readonly visitor: DataVisitor) {}

    public onRecord(data: Buffer, record: ParsedDataRecord): boolean {
        this.loader.loadMeta(record.parsed.readings.meta).then((meta) => this.visitor.onData(record, meta));
        return true;
    }
}

export class DataReader implements MetaLoader {
    private readonly cached: { [key: string]: Promise<ParsedDataRecord> } = {};
    private readonly files: DataFile[];
    private infosByPath: { [key: string]: { info: FileInfo; file: DataFile } } = {};

    constructor(services: ServiceFunc, paths: string[]) {
        this.files = paths.map((path) => new DataFile(services, path, getPathFileType(path)));
    }

    public async walkData<T extends DataVisitor>(params: DataWalkParams, visitor: T): Promise<T> {
        console.log("walk-data:walking");
        const started = new Date();

        // Analyze and get record and time information. TODO Cache eventually.
        this.infosByPath = await Promise.all(
            this.files.map((file) =>
                file.analyze().then((info) => {
                    return {
                        file: file,
                        info: info,
                    };
                })
            )
        ).then((infos) => _.keyBy(infos, (info) => info.file.path));

        console.log("walk-data:infos", this.infosByPath);

        const metaVisitor = new LoadMetaVisitor(this, visitor);

        // Walk each data file, in order.
        return serializePromiseChain(this.datas, (file) => file.walkRecords(metaVisitor)).then(() => {
            return Promise.all(Object.values(this.cached)).then(() => {
                const done = new Date();
                const elapsed = done.getTime() - started.getTime();
                console.log("walk-data:done", elapsed);
                return visitor;
            });
        });
    }

    public loadMeta(record: number): Promise<ParsedDataRecord> {
        const key = this.makeRecordKey(record);
        if (this.cached[key]) {
            return this.cached[key];
        }

        const files = Object.values(this.infosByPath)
            .filter((v) => v.file.type == FileType.Meta)
            .filter((v) => v.info.records.first <= record && record <= v.info.records.last);

        this.cached[key] = Promise.all(files.map((f) => f.file.find(record))).then((metas) => metas[0]);

        return this.cached[key];
    }

    private get datas(): DataFile[] {
        return this.files.filter((f) => f.type == FileType.Data);
    }

    private makeRecordKey(record: number): string {
        return record.toString();
    }
}

export function testWithFiles(cfy: Conservify, files: string[]) {
    return new DataReader(() => cfy, files)
        .walkData(new DataWalkParams(Time.Min, Time.Max), new StatisticsDataVisitor())
        .then((visitor) => {
            console.log("done", visitor.visited);
        });
}
