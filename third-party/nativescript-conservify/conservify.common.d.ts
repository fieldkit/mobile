import { Observable } from "tns-core-modules/data/observable";
export declare class Common extends Observable {
    constructor();
}
export declare class FileSystemError extends Error {
    readonly path: string;
    constructor(message: any, path: any);
}
export declare class ConnectionError extends Error {
    readonly info: string;
    constructor(message: any, info: any);
}
export interface PromiseCallbacks {
    resolve(value: any): void;
    reject(error: Error): void;
}
