import { DownloaderBase, DownloadOptions, StatusCode, DownloadEventData } from './downloader.common';
import { DownloadsData } from './enums';
export declare class Downloader extends DownloaderBase {
    private fetch;
    downloadsData: Map<String, DownloadsData>;
    private manager;
    private worker;
    downloadRequests: Map<any, any>;
    taskIds: Map<string, string>;
    constructor();
    static init(): void;
    static setTimeout(timeout: number): void;
    createDownload(options: DownloadOptions): string;
    getStatus(id: string): StatusCode;
    start(id: string, progress?: Function): Promise<DownloadEventData>;
    resume(id: string): void;
    cancel(id: string): void;
    pause(id: string): void;
    getPath(id: string): string;
}
