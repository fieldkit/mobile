import _ from "lodash";
import { FileType } from "@/store/types";
import { serializePromiseChain } from "./utilities";
import { DataServices } from "./data-services";
import { ParsedDataRecord, ParsedRecordVisitor, DataFile, FileInfo, coerceNumber } from "./data-file";
import { debug } from "./debugging";

export interface DataVisitor {
    onData(data: ParsedDataRecord, meta: ParsedDataRecord): void;
    onDone(): void;
}

interface MetaLoader {
    loadMeta(record: number): Promise<ParsedDataRecord>;
}

class LoadMetaVisitor implements ParsedRecordVisitor {
    constructor(public readonly loader: MetaLoader, public readonly visitor: DataVisitor) {}

    public onRecord(_data: Buffer, record: ParsedDataRecord): boolean {
        const metaNumber = record.parsed?.readings?.meta || null;
        if (!metaNumber) throw new Error(`data record missing meta record number`);
        void this.loader.loadMeta(coerceNumber(metaNumber)).then((meta) => this.visitor.onData(record, meta));
        return true;
    }
}

export class DataReader implements MetaLoader {
    private readonly cached: { [key: string]: Promise<ParsedDataRecord> } = {};
    private readonly files: DataFile[];
    private infosByPath: { [key: string]: { info: FileInfo; file: DataFile } } = {};

    constructor(services: DataServices, paths: string[]) {
        this.files = paths.map((path) => new DataFile(services, path));
    }

    public async walkData<T extends DataVisitor>(visitor: T): Promise<T> {
        debug.log("walk-data:walking");
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

        debug.log("walk-data:infos", this.infosByPath);

        const metaVisitor = new LoadMetaVisitor(this, visitor);

        // Walk each data file, in order.
        return serializePromiseChain(this.datas, (file) => file.walkRecords(metaVisitor))
            .then(() => {
                visitor.onDone();

                return Promise.all(Object.values(this.cached)).then(() => {
                    const done = new Date();
                    const elapsed = done.getTime() - started.getTime();
                    debug.log("walk-data:done", elapsed);
                });
            })
            .then(() => {
                return visitor;
            });
    }

    public loadMeta(record: number): Promise<ParsedDataRecord> {
        const key = this.makeRecordKey(record);
        if (this.cached[key] !== undefined) {
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
