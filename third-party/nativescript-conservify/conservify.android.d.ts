import { TransferInfo } from "./conservify.common";
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
    start(serviceTypeSearch?: string | null, serviceNameSelf?: string | null, serviceTypeSelf?: string | null): Promise<any>;
    stop(): Promise<any>;
    writeSampleData(): Promise<any>;
    open(path: string): Promise<OpenedFile>;
    text(info: TransferInfo): Promise<any>;
    json(info: TransferInfo): Promise<any>;
    protobuf(info: TransferInfo): Promise<any>;
    download(info: TransferInfo): Promise<any>;
    upload(info: TransferInfo): Promise<any>;
    findConnectedNetwork(): Promise<any>;
    scanNetworks(): Promise<any>;
}
export {};
