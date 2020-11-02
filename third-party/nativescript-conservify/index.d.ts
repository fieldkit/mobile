import { Common } from "./conservify.common";

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
    body: string;
}

export declare interface TransferInfo {
    url: string;
    method?: string;
    body?: Uint8Array | string;
    path?: string;
    connectionTimeout?: number;
    defaultTimeout?: number;
    headers?: { [index: string]: string };
    progress?: ProgressFunc;
}

export declare class Conservify extends Common {
    constructor(discoveryEvents: DiscoveryEvents, logger: LoggerFunc);
    start(
        serviceTypeSearch: string | null = null,
        serviceNameSelf: string | null = null,
        serviceTypeSelf: string | null = null
    ): Promise<void>;
    stop(): Promise<void>;
    text(info: TransferInfo): Promise<HttpResponse>;
    json(info: TransferInfo): Promise<HttpResponse>;
    protobuf(info: TransferInfo): Promise<HttpResponse>;
    download(info: TransferInfo): Promise<HttpResponse>;
    upload(info: TransferInfo): Promise<HttpResponse>;
    scanNetworks(): Promise<any>;
    findConnectedNetwork(): Promise<any>;
    open(path: string): Promise<OpenedFile>;
}
