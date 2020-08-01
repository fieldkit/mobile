import { Common } from "./conservify.common";
declare class OpenedFile {
    cfy: Conservify;
    fs: any;
    file: any;
    constructor(cfy: Conservify, file: any);
    info(): Promise<{}>;
    delimited(listener: any): Promise<{}>;
}
export declare class Conservify extends Common {
    logger: any;
    discoveryEvents: any;
    active: {
        [key: string]: any;
    };
    scan: any;
    started: any;
    stopped: any;
    connected: any;
    networkStatus: any;
    networkingListener: org.conservify.networking.NetworkingListener;
    downloadListener: org.conservify.networking.WebTransferListener;
    uploadListener: org.conservify.networking.WebTransferListener;
    fsListener: org.conservify.data.FileSystemListener;
    networking: org.conservify.networking.Networking;
    fileSystem: org.conservify.data.FileSystem;
    constructor(discoveryEvents: any, logger: any);
    start(serviceType: string): Promise<{}>;
    stop(): Promise<{}>;
    writeSampleData(): Promise<string>;
    open(path: any): Promise<OpenedFile>;
    text(info: any): Promise<{}>;
    json(info: any): Promise<{}>;
    protobuf(info: any): Promise<{}>;
    download(info: any): Promise<{}>;
    upload(info: any): Promise<{}>;
    findConnectedNetwork(): Promise<{}>;
    scanNetworks(): Promise<{}>;
}
export {};
