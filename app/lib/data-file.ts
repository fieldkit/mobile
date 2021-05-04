import _ from "lodash";
import Long from "long";
import { FileType } from "@/store/types";
import { DataServices } from "./data-services";
import { fk_data } from "fk-data-protocol/fk-data";
import { Buffer } from "buffer";

const PbDataRecord = fk_data.DataRecord;
const PbSignedRecord = fk_data.SignedRecord;

export function coerceNumber(value: Long | number): number {
    if (value instanceof Long) return value.toNumber();
    return value;
}

export interface ParsedDataRecord {
    type: FileType;
    record: number;
    time: number;
    parsed: fk_data.DataRecord;
}

interface SignedRecord {
    record: number;
    time: number;
    data: string;
}

export interface ParsedRecordVisitor {
    onRecord(data: Buffer, record: ParsedDataRecord): boolean;
}

type ParseFunc = (buffer: Buffer) => ParsedDataRecord;

interface RawRecordVisitor {
    onRecord(data: Buffer, parse: ParseFunc): boolean;
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

function parseDataRecord(buffer: Buffer): ParsedDataRecord {
    const parsed = PbDataRecord.decode(buffer);
    const time = parsed.readings?.time;
    const reading = parsed.readings?.reading;
    if (!time) throw new Error(`no reading time: JSON.stringify(parsed)`);
    if (!reading) throw new Error(`no reading number: JSON.stringify(parsed)`);
    return {
        type: FileType.Data,
        time: coerceNumber(time),
        record: coerceNumber(reading),
        parsed: parsed,
    };
}

function parseMetaRecord(buffer: Buffer): ParsedDataRecord {
    const signed = (PbSignedRecord.decode(buffer) as unknown) as SignedRecord;
    const parsed = PbDataRecord.decodeDelimited(Buffer.from(signed.data, "base64"));
    return {
        type: FileType.Meta,
        time: signed.time,
        record: signed.record,
        parsed: parsed,
    };
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

class RecordsInfoVisitor implements RawRecordVisitor {
    private first: ParsedDataRecord | null = null;
    private last: ParsedDataRecord | null = null;
    private times: { start: number | null; end: number | null } = { start: null, end: null };
    private total = 0;

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

interface Records {
    size(): number;
    get(i: number): string;
}

export class DataFile {
    public readonly type: FileType;

    constructor(private readonly services: DataServices, public readonly path: string) {
        this.type = getPathFileType(path);
    }

    public analyze(): Promise<FileInfo> {
        return this.walkRaw(new RecordsInfoVisitor()).then((visitor) => visitor.get());
    }

    public walkRecords<T extends ParsedRecordVisitor>(visitor: T): Promise<T> {
        return this.walkRaw(new ParseRecordsVisitor(visitor)).then(() => visitor);
    }

    private walkRaw<T extends RawRecordVisitor>(visitor: T): Promise<T> {
        console.log("walk-raw:walking", this.path);
        const started = new Date();
        const parseFunction = this.parseFunction;
        return this.services()
            .open(this.path)
            .then((file) => {
                return file
                    .delimited((_position: number, _size: number, records: Records) => {
                        for (let i = 0; i < records.size(); ++i) {
                            const buffer = Buffer.from(records.get(i), "base64");
                            try {
                                if (!visitor.onRecord(buffer, parseFunction)) {
                                    // TODO Stop!
                                }
                            } catch (error) {
                                console.log(`error handling raw record: ${JSON.stringify(error)}`);
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

class FileRecords {
    constructor(public readonly first: number, public readonly last: number, public readonly total: number) {}
}

class FileTimes {
    constructor(public readonly start: number, public readonly end: number) {}
}

export class FileInfo {
    constructor(public readonly records: FileRecords, public readonly times: FileTimes) {}
}
