import { Common } from "./conservify.common";

type LoggerFunc = (...args: any[]) => void;

export declare interface DiscoveryEvents {}

export declare type DelimitedCallback = (position: number, size: number, records: any) => void;

export declare type ProgressFunc = (total: number, copied: number, info) => void;

export declare interface OpenedFile {
    delimited(callback: DelimitedCallback): Promise<any>;
}

export declare interface TransferInfo {
    url: string;
    method?: string;
    body?: string;
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
    ): Promise<any>;
    stop(): Promise<any>;
    text(info: TransferInfo): Promise<any>;
    json(info: TransferInfo): Promise<any>;
    protobuf(info: TransferInfo): Promise<any>;
    download(info: TransferInfo): Promise<any>;
    upload(info: TransferInfo): Promise<any>;
    scanNetworks(): Promise<any>;
    findConnectedNetwork(): Promise<any>;
    open(path: string): Promise<OpenedFile>;
}
