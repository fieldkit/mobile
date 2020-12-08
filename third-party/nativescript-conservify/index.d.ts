type LoggerFunc = (...args: any[]) => void;

export declare interface DiscoveryEvents {}

export declare type DelimitedCallback = (position: number, size: number, records: any) => void;

export declare type ProgressFunc = (total: number, copied: number, info) => void;

export declare interface OpenedFile {
    delimited(callback: DelimitedCallback): Promise<any>;
}

export declare interface HttpResponse {
    statusCode: number;
    headers: { [index: string]: string };
    body: Buffer;
}

export declare interface TransferInfo {
    url: string;
    method?: string;
    body?: Uint8Array | string;
    path?: string;
    uploadCopy?: boolean;
    favorLocal?: boolean;
    connectionTimeout?: number;
    defaultTimeout?: number;
    headers?: { [index: string]: string };
    progress?: ProgressFunc;
}

export declare interface ConnectedNetwork {
    connectedWifi: {
        ssid: string;
    };
}

export declare interface ScannedNetworks {
    //
}

export declare interface StartOptions {
    serviceTypeSearch: string | null;
    serviceNameSelf: string | null;
    serviceTypeSelf: string | null;
}

export declare interface StopOptions {
    suspending: boolean;
    mdns?: boolean;
    dns?: boolean;
}

export declare class Conservify {
    constructor(discoveryEvents: DiscoveryEvents, logger: LoggerFunc);
    start(options: StartOptions): Promise<void>;
    stop(options: StopOptions): Promise<void>;
    text(info: TransferInfo): Promise<HttpResponse>;
    json(info: TransferInfo): Promise<HttpResponse>;
    protobuf(info: TransferInfo): Promise<HttpResponse>;
    download(info: TransferInfo): Promise<HttpResponse>;
    upload(info: TransferInfo): Promise<HttpResponse>;
    scanNetworks(): Promise<ScannedNetworks>;
    findConnectedNetwork(): Promise<ConnectedNetwork>;
    open(path: string): Promise<OpenedFile>;
    copyFile(source: string, destiny: string): Promise<boolean>;
}
