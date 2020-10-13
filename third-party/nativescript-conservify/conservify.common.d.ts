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
    body?: string;
    path?: string;
    connectionTimeout?: number;
    defaultTimeout?: number;
    headers?: {
        [index: string]: string;
    };
}
