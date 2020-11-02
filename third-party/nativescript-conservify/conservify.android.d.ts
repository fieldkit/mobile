import { TransferInfo, HttpResponse } from "./conservify.common";
declare class OpenedFile {
    cfy: Conservify;
    fs: any;
    file: any;
    constructor(cfy: Conservify, file: any);
    info(): Promise<{}>;
    delimited(listener: any): Promise<{}>;
}
export declare class Conservify {
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
    start(serviceTypeSearch?: string | null, serviceNameSelf?: string | null, serviceTypeSelf?: string | null): Promise<void>;
    stop(): Promise<void>;
    writeSampleData(): Promise<void>;
    open(path: string): Promise<OpenedFile>;
    text(info: TransferInfo): Promise<HttpResponse>;
    json(info: TransferInfo): Promise<HttpResponse>;
    protobuf(info: TransferInfo): Promise<HttpResponse>;
    download(info: TransferInfo): Promise<HttpResponse>;
    upload(info: TransferInfo): Promise<HttpResponse>;
    findConnectedNetwork(): Promise<any>;
    scanNetworks(): Promise<any>;
}
export {};
