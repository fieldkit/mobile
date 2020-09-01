import { FileType } from "@/store/types";

import protobuf from "protobufjs";

const dataRoot = protobuf.Root.fromJSON(require("fk-data-protocol"));
const PbDataRecord = dataRoot.lookupType("fk_data.DataRecord");
const PbSignedRecord = dataRoot.lookupType("fk_data.SignedRecord");

export interface SignedRecord {
    record: number;
    time: number;
    data: string;
}

export interface DataRecord {}

export interface ParsedDataRecord {
    type: FileType;
    record: number;
    parsed: DataRecord;
}

type ParseFunc = (buffer: Buffer) => ParsedDataRecord;

function parseDataRecord(buffer: Buffer): ParsedDataRecord {
    const parsed = PbDataRecord.decode(buffer) as any;
    if (parsed.readings?.reading === undefined) {
        throw new Error(`no reading number: JSON.stringify(parsed)`);
    }
    return {
        type: FileType.Data,
        record: parsed.readings.reading,
        parsed: parsed,
    };
}

function parseMetaRecord(buffer: Buffer): ParsedDataRecord {
    const signed = PbSignedRecord.decode(buffer) as any;
    const parsed = PbDataRecord.decodeDelimited(Buffer.from(signed.data, "base64")) as any;
    return {
        type: FileType.Meta,
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

export class FileRecords {
    constructor(public readonly first, public readonly last, public readonly total) {}
}

interface RecordVisitor {
    onMeta(data: Buffer, record: ParsedDataRecord): boolean;
    onData(data: Buffer, record: ParsedDataRecord): boolean;
}

interface RawRecordVisitor {
    onRecord(data: Buffer, parse: ParseFunc): boolean;
}

class RecordsInfoVisitor implements RawRecordVisitor {
    private first: Buffer | null = null;
    private last: Buffer | null = null;
    private parse: ParseFunc | null = null;
    private total: number = 0;

    public onRecord(data: Buffer, parse: ParseFunc): boolean {
        if (this.first == null) {
            this.first = data;
        }
        this.last = data;
        this.parse = parse;
        this.total += 1;
        return true;
    }

    public get(): FileRecords {
        if (!this.last || !this.first || !this.parse) {
            throw new Error(`no records in file`);
        }
        const firstParsed = this.parse(this.first);
        const lastParsed = this.parse(this.last);
        return new FileRecords(firstParsed.record, lastParsed.record, this.total);
    }
}

class ParseRecordsVisitor implements RawRecordVisitor {
    constructor(private readonly visitor: RecordVisitor) {}

    public onRecord(data: Buffer, parse: ParseFunc): boolean {
        const parsed = parse(data);
        switch (parsed.type) {
            case FileType.Meta:
                return this.visitor.onMeta(data, parsed);
            case FileType.Data:
                return this.visitor.onData(data, parsed);
        }
        return false;
    }
}

export class DataFile {
    constructor(private readonly cfy: Conservify, public readonly path: string, public readonly type: FileType) {}

    public getRecords(): Promise<FileRecords> {
        return this.walkRaw(new RecordsInfoVisitor()).then((visitor) => visitor.get());
    }

    public walkRecords<T extends RecordVisitor>(visitor: T): Promise<T> {
        return this.walkRaw(new ParseRecordsVisitor(visitor)).then((rawVisitor) => visitor);
    }

    private walkRaw<T extends RawRecordVisitor>(visitor: T): Promise<T> {
        console.log("walk-raw:walking");
        const started = new Date();
        const parse = this.getParseFunction();
        return this.cfy.open(this.path).then((file) => {
            return file
                .delimited((position, size, records) => {
                    for (let i = 0; i < records.size(); ++i) {
                        const buffer = Buffer.from(records.get(i), "base64");
                        try {
                            visitor.onRecord(buffer, parse);
                        } catch (e) {
                            console.log(`error handling raw record: ${e.message}`);
                        }
                    }
                })
                .then(() => {
                    const done = new Date();
                    const elapsed = done.getTime() - started.getTime();
                    console.log("walk-raw:done", elapsed);
                    return visitor;
                });
        });
    }

    private getParseFunction() {
        switch (this.type) {
            case FileType.Meta:
                return parseMetaRecord;
            case FileType.Data:
                return parseDataRecord;
        }
        throw new Error(`undefined type: ${this.type}`);
    }
}

export class DataReader {
    constructor(public readonly cfy: Conservify, public readonly file: string) {}
}

export function getPathFileType(path: string): FileType {
    if (/data\.fkpb/.test(path)) {
        return FileType.Data;
    }
    if (/meta\.fkpb/.test(path)) {
        return FileType.Meta;
    }
    throw new Error(`unable to get file type: ${path}`);
}

export function testWithFiles(cfy: Conservify, files: string[]) {
    const metaPaths = files.filter((f) => getPathFileType(f) == FileType.Meta);
    const dataPaths = files.filter((f) => getPathFileType(f) == FileType.Data);
    console.log("meta", metaPaths);
    console.log("data", dataPaths);
    return Promise.all(files.map((path) => new DataFile(cfy, path, getPathFileType(path)).getRecords())).then((infos) => {
        console.log(infos);
    });
}
