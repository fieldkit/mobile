import { Common } from "./conservify.common";
interface NetworkingListener {
    onStarted(): void;
    onDiscoveryFailed(): void;
    onFoundServiceWithService(service: ServiceInfo): void;
    onLostServiceWithService(service: ServiceInfo): void;
    onNetworkStatusWithStatus(status: NetworkingStatus): void;
}
declare var NetworkingListener: {
    prototype: NetworkingListener;
};
interface WebTransferListener {
    onProgressWithTaskIdHeadersBytesTotal(taskId: string, headers: any, bytes: number, total: number): void;
    onCompleteWithTaskIdHeadersContentTypeBodyStatusCode(taskId: string, headers: any, contentType: string, body: any, statusCode: number): void;
    onErrorWithTaskIdMessage(taskId: string, message: string): void;
}
declare var WebTransferListener: {
    prototype: WebTransferListener;
};
declare class WifiNetwork extends NSObject {
    ssid: string;
}
declare class WifiNetworks extends NSObject {
    networks: WifiNetwork[];
}
declare class NetworkingStatus extends NSObject {
    connected: boolean;
    connectedWifi: WifiNetwork;
    wifiNetworks: WifiNetworks;
    scanError: boolean;
}
declare class WebTransfer extends NSObject {
    static alloc(): WebTransfer;
    static new(): WebTransfer;
    id: string;
    method: string;
    url: string;
    path: string;
    body: any;
    base64EncodeResponseBody: boolean;
    base64DecodeRequestBody: boolean;
    headerWithKeyValue(key: string, value: string): WebTransfer;
}
declare class ServiceInfo extends NSObject {
    type: string;
    name: string;
    host: string;
    port: number;
}
declare class ServiceDiscovery extends NSObject {
    startWithServiceType(serviceType: string): void;
}
declare class Web extends NSObject {
    simpleWithInfo(info: WebTransfer): string;
    downloadWithInfo(info: WebTransfer): string;
    uploadWithInfo(info: WebTransfer): string;
}
declare class WifiNetworksManager extends NSObject {
    findConnectedNetwork(): void;
    scan(): void;
}
declare class Networking extends NSObject {
    static alloc(): Networking;
    static new(): Networking;
    initWithNetworkingListenerUploadListenerDownloadListener(networkingListener: NetworkingListener, uploadListener: WebTransferListener, downloadListener: WebTransferListener): Networking;
    serviceDiscovery: ServiceDiscovery;
    web: Web;
    wifi: WifiNetworksManager;
}
interface OtherPromises {
    getStartedPromise(): Promise;
    getNetworkStatusPromise(): Promise;
    getDiscoveryEvents(): any;
}
declare class MyNetworkingListener extends NSObject implements NetworkingListener {
    static ObjCProtocols: {
        prototype: NetworkingListener;
    }[];
    promises: OtherPromises;
    logger: any;
    static alloc(): MyNetworkingListener;
    initWithPromises(promises: OtherPromises, logger: any): MyNetworkingListener;
    onStarted(): void;
    onDiscoveryFailed(): void;
    onFoundServiceWithService(service: ServiceInfo): void;
    onLostServiceWithService(service: ServiceInfo): void;
    onNetworkStatusWithStatus(status: NetworkingStatus): void;
}
interface ActiveTasks {
    getTask(id: string): any;
    removeTask(id: string): void;
}
export declare class Conservify extends Common implements ActiveTasks, OtherPromises {
    logger: any;
    active: {
        [key: string]: any;
    };
    networkStatus: any;
    started: any;
    networking: Networking;
    networkingListener: MyNetworkingListener;
    uploadListener: WebTransferListener;
    downloadListener: WebTransferListener;
    discoveryEvents: any;
    constructor(discoveryEvents: any, logger: any);
    getTask(id: string): any;
    removeTask(id: string): void;
    start(serviceType: string): Promise<{}>;
    json(info: any): Promise<{}>;
    text(info: any): Promise<{}>;
    protobuf(info: any): Promise<{}>;
    download(info: any): Promise<{}>;
    upload(info: any): Promise<{}>;
    getDiscoveryEvents(): any;
    getStartedPromise(): Promise;
    getNetworkStatusPromise(): Promise;
    findConnectedNetwork(): Promise<{}>;
    scanNetworks(): Promise<{}>;
}
export {};
