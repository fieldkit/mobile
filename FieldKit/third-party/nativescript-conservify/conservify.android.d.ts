import { Common } from './conservify.common';
export declare class Conservify extends Common {
    discoveryEvents: any;
    active: {
        [key: string]: any;
    };
    scan: any;
    connected: any;
    networkingListener: org.conservify.networking.NetworkingListener;
    downloadListener: org.conservify.networking.WebTransferListener;
    uploadListener: org.conservify.networking.WebTransferListener;
    networking: org.conservify.networking.Networking;
    dataListener: org.conservify.data.DataListener;
    fileSystem: org.conservify.data.FileSystem;
    constructor(discoveryEvents: any);
    start(serviceType: string): Promise<{}>;
    json(info: any): Promise<{}>;
    protobuf(info: any): Promise<{}>;
    download(info: any): Promise<{}>;
    upload(info: any): Promise<{}>;
    findConnectedNetwork(): Promise<{}>;
    scanNetworks(): Promise<{}>;
}
