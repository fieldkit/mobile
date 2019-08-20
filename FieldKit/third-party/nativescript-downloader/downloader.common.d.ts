import { Observable } from 'tns-core-modules/data/observable';
export declare abstract class DownloaderBase extends Observable {
    downloads: Map<String, any>;
    downloadsData: Map<String, any>;
    android: any;
    ios: any;
    constructor();
    abstract createDownload(options: DownloadOptions): string;
    abstract start(id: string, progress?: Function): Promise<DownloadEventData>;
    abstract resume(id: string): void;
    abstract pause(id: string): void;
    abstract cancel(id: string): void;
    abstract getStatus(id: string): StatusCode;
    abstract getPath(id: string): string;
}
export declare function generateId(): string;
export interface DownloadEventError {
    status: string;
    message: string;
}
export interface DownloadEventData {
    status: string;
    path: string;
    message?: string;
}
export interface ProgressEventData {
    value: number;
    currentSize: number;
    totalSize: number;
    speed: number;
}
export declare enum StatusCode {
    PENDING = "pending",
    PAUSED = "paused",
    DOWNLOADING = "downloading",
    COMPLETED = "completed",
    ERROR = "error",
}
export interface DownloadOptions {
    url: string;
    query?: Object | string;
    headers?: Object;
    path?: string;
    fileName?: string;
}
