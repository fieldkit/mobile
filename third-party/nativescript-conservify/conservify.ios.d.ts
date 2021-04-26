import { PromiseCallbacks, TransferInfo, HttpResponse, StartOptions, StopOptions } from "./conservify.common";
export * from "./conservify.common";
declare class ReadOptions extends NSObject {
    static alloc(): ReadOptions;
    static new(): ReadOptions;
    batchSize: number;
}
declare class PbFile {
    readInfoWithToken(token: string): boolean;
    readDelimitedWithTokenOptions(token: string, options: ReadOptions): boolean;
}
interface FileSystemListener {
    onFileInfoWithPathTokenInfo(path: string, token: string, info: any): void;
    onFileRecordsWithPathTokenPositionSizeRecords(path: string, token: string, position: number, size: number, records: any): void;
    onFileErrorWithPathTokenError(path: string, token: string, error: string): void;
}
declare var FileSystemListener: {
    prototype: FileSystemListener;
};
declare class FileSystem extends NSObject {
    static alloc(): FileSystem;
    static new(): FileSystem;
    initWithListener(listener: FileSystemListener): FileSystem;
    openWithPath(path: string): PbFile;
    copyFileWithSourceDestiny(source: string, destiny: string): boolean;
    newToken(): string;
}
interface OtherPromises {
    getStartedPromise(): PromiseCallbacks;
    getStoppedPromise(): PromiseCallbacks;
    getNetworkStatusPromise(): PromiseCallbacks;
    getDiscoveryEvents(): any;
}
interface ActiveTasks {
    getTask(id: string): any;
    removeTask(id: string): void;
}
declare class OpenedFile {
    private cfy;
    private fs;
    private file;
    constructor(cfy: Conservify, file: PbFile);
    info(): Promise<unknown>;
    delimited(listener: any): Promise<unknown>;
}
export declare class Conservify implements ActiveTasks, OtherPromises {
    private logger;
    active: {
        [key: string]: any;
    };
    private networkStatus;
    private started;
    private stopped;
    private scan;
    private networking;
    fileSystem: FileSystem;
    private networkingListener;
    private uploadListener;
    private downloadListener;
    private fsListener;
    private discoveryEvents;
    constructor(discoveryEvents: any, logger: any);
    getTask(id: string): any;
    removeTask(id: string): void;
    start(options: StartOptions): Promise<any>;
    stop(options: StopOptions): Promise<void>;
    writeSampleData(): Promise<void>;
    open(path: string): Promise<OpenedFile>;
    copyFile(source: string, destiny: string): Promise<boolean>;
    json(info: TransferInfo): Promise<HttpResponse>;
    text(info: TransferInfo): Promise<HttpResponse>;
    protobuf(info: TransferInfo): Promise<HttpResponse>;
    download(info: TransferInfo): Promise<HttpResponse>;
    upload(info: TransferInfo): Promise<HttpResponse>;
    getDiscoveryEvents(): any;
    getStartedPromise(): PromiseCallbacks;
    getStoppedPromise(): PromiseCallbacks;
    getNetworkStatusPromise(): PromiseCallbacks;
    findConnectedNetwork(): Promise<any>;
    scanNetworks(): Promise<any>;
}
