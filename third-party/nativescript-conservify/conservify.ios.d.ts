import { PromiseCallbacks, TransferInfo, HttpResponse } from "./conservify.common";
interface NetworkingListener {
    onStarted(): void;
    onDiscoveryFailed(): void;
    onFoundServiceWithService(service: ServiceInfo): void;
    onLostServiceWithService(service: ServiceInfo): void;
    onNetworkStatusWithStatus(status: NetworkingStatus): void;
    onUdpMessageWithMessage(message: UdpMessage): void;
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
declare class UdpMessage extends NSObject {
    address: string;
    data: string;
}
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
    newToken(): string;
}
declare class ServiceDiscovery extends NSObject {
    startWithServiceTypeSearchServiceNameSelfServiceTypeSelf(serviceTypeSearch: string | null, serviceNameSelf: string | null, serviceTypeSelf: string | null): void;
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
    getStartedPromise(): PromiseCallbacks;
    getNetworkStatusPromise(): PromiseCallbacks;
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
    onStopped(): void;
    onDiscoveryFailed(): void;
    onFoundServiceWithService(service: ServiceInfo): void;
    onLostServiceWithService(service: ServiceInfo): void;
    onUdpMessageWithMessage(message: UdpMessage): void;
    onNetworkStatusWithStatus(status: NetworkingStatus): void;
}
interface ActiveTasks {
    getTask(id: string): any;
    removeTask(id: string): void;
}
declare class MyFileSystemListener extends NSObject implements FileSystemListener {
    static ObjCProtocols: {
        prototype: FileSystemListener;
    }[];
    logger: any;
    tasks: ActiveTasks;
    static alloc(): MyFileSystemListener;
    initWithTasks(tasks: ActiveTasks, logger: any): MyFileSystemListener;
    onFileInfoWithPathTokenInfo(path: string, token: string, info: any): void;
    onFileRecordsWithPathTokenPositionSizeRecords(path: string, token: string, position: number, size: number, records: any): void;
    onFileErrorWithPathTokenError(path: string, token: string, error: string): void;
}
declare class OpenedFile {
    cfy: Conservify;
    fs: FileSystem;
    file: PbFile;
    constructor(cfy: Conservify, file: PbFile);
    info(): Promise<{}>;
    delimited(listener: any): Promise<{}>;
}
export declare class Conservify implements ActiveTasks, OtherPromises {
    logger: any;
    active: {
        [key: string]: any;
    };
    networkStatus: any;
    started: any;
    scan: any;
    networking: Networking;
    fileSystem: FileSystem;
    networkingListener: MyNetworkingListener;
    uploadListener: WebTransferListener;
    downloadListener: WebTransferListener;
    fsListener: MyFileSystemListener;
    discoveryEvents: any;
    constructor(discoveryEvents: any, logger: any);
    getTask(id: string): any;
    removeTask(id: string): void;
    stop(): Promise<void>;
    start(serviceTypeSearch?: string | null, serviceNameSelf?: string | null, serviceTypeSelf?: string | null): Promise<any>;
    writeSampleData(): Promise<void>;
    open(path: string): Promise<OpenedFile>;
    json(info: TransferInfo): Promise<HttpResponse>;
    text(info: TransferInfo): Promise<HttpResponse>;
    protobuf(info: TransferInfo): Promise<HttpResponse>;
    download(info: TransferInfo): Promise<HttpResponse>;
    upload(info: TransferInfo): Promise<HttpResponse>;
    getDiscoveryEvents(): any;
    getStartedPromise(): PromiseCallbacks;
    getNetworkStatusPromise(): PromiseCallbacks;
    findConnectedNetwork(): Promise<any>;
    scanNetworks(): Promise<any>;
}
export {};
