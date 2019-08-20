import { DownloaderBase, DownloadOptions, DownloadEventData, StatusCode } from './downloader.common';
export declare class Downloader extends DownloaderBase {
    constructor();
    private static timeout;
    static init(): void;
    static setTimeout(timeout: number): void;
    createDownload(options: DownloadOptions): string;
    start(id: string, progress?: Function): Promise<DownloadEventData>;
    getStatus(id: string): StatusCode;
    pause(id: string): void;
    resume(id: string): void;
    cancel(id: string): void;
    getPath(id: string): string;
}
