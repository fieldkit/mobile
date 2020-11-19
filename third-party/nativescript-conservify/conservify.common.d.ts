export declare class FileSystemError extends Error {
    readonly path: string;
    constructor(message: string, path: string);
}
export declare class ConnectionError extends Error {
    readonly info: string;
    constructor(message: string, info: string);
}
export interface PromiseCallbacks {
    resolve(value: any): void;
    reject(error: Error): void;
}
export interface TransferInfo {
    url: string;
    method?: string;
    body?: Uint8Array | string;
    path?: string;
    uploadCopy?: boolean;
    connectionTimeout?: number;
    defaultTimeout?: number;
    headers?: {
        [index: string]: string;
    };
}
export interface HttpResponse {
    statusCode: number;
    headers: {
        [index: string]: string;
    };
    body: string;
}
export declare function encodeBody(body: Uint8Array | string): string;
export interface StartOptions {
    serviceTypeSearch: string | null;
    serviceNameSelf: string | null;
    serviceTypeSelf: string | null;
    dns?: boolean;
}
export interface StopOptions {
    suspending: boolean;
    mdns?: boolean;
    dns?: boolean;
}
