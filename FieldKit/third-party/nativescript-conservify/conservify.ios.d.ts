import { Common } from './conservify.common';
interface NetworkingListener {
    onStarted(): void;
    onFoundServiceWithService(service: ServiceInfo): void;
    onLostServiceWithService(service: ServiceInfo): void;
    onConnectionInfoWithConnected(connected: boolean): void;
    onConnectedNetworkWithNetwork(network: WifiNetwork): void;
    onNetworksFoundWithNetworks(networks: WifiNetworks): void;
    onNetworkScanError(): void;
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
declare class WebTransfer extends NSObject {
    static alloc(): WebTransfer;
    static new(): WebTransfer;
    method: string;
    url: string;
    path: string;
    body: any;
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
    getDiscoveryEvents(): any;
    getConnectedNetworkPromise(): Promise;
    getScanPromise(): Promise;
}
declare class MyNetworkingListener extends NSObject implements NetworkingListener {
    static ObjCProtocols: {
        prototype: NetworkingListener;
    }[];
    promises: OtherPromises;
    static alloc(): MyNetworkingListener;
    initWithPromises(promises: OtherPromises): MyNetworkingListener;
    onStarted(): void;
    onFoundServiceWithService(service: ServiceInfo): void;
    onLostServiceWithService(service: ServiceInfo): void;
    onConnectionInfoWithConnected(connected: boolean): void;
    onConnectedNetworkWithNetwork(network: WifiNetwork): void;
    onNetworksFoundWithNetworks(networks: WifiNetworks): void;
    onNetworkScanError(): void;
}
interface ActiveTasks {
    getTask(id: string): any;
    removeTask(id: string): void;
}
export declare class Conservify extends Common implements ActiveTasks, OtherPromises {
    active: {
        [key: string]: any;
    };
    scan: any;
    networking: Networking;
    networkingListener: MyNetworkingListener;
    uploadListener: WebTransferListener;
    downloadListener: WebTransferListener;
    discoveryEvents: any;
    constructor(discoveryEvents: any);
    getTask(id: string): any;
    removeTask(id: string): void;
    start(serviceType: string): Promise<{}>;
    json(info: any): Promise<{}>;
    protobuf(info: any): Promise<{}>;
    download(info: any): Promise<{}>;
    upload(info: any): Promise<{}>;
    getDiscoveryEvents(): any;
    getConnectedNetworkPromise(): Promise;
    getScanPromise(): Promise;
    findConnectedNetwork(): Promise<{}>;
    scanNetworks(): Promise<{}>;
}
export {};
