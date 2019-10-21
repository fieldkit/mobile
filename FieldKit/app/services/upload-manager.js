import _ from "lodash";
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";
import * as BackgroundHttp from "nativescript-background-http";
import { keysToCamel, serializePromiseChain } from "../utilities";
import Config from "../config";

const log = Config.logger("UploadManager");
const SessionName = "fk-data-upload";

export default class UploadManager {
    constructor(databaseInterface, portalInterface, progressService) {
        this.databaseInterface = databaseInterface;
        this.portalInterface = portalInterface;
        this.progressService = progressService;
    }

    getStatus() {
        return this.databaseInterface.getPendingDownloads().then(pending => {
            log.info("pending", pending);
            return {
                pending: {
                    files: pending.length,
                    allowed: pending.length > 0,
                    bytes: _(pending)
                        .map("size")
                        .sum(),
                    devices: _(pending)
                        .groupBy("deviceId")
                        .size()
                }
            };
        });
    }

    synchronizePortal() {
        log.info("synchronizePortal");

        // TODO Replace with connectivity check.
        if (!this.portalInterface.isLoggedIn()) {
            log.info("offline!");
            return Promise.reject({
                offline: true
            });
        }

        const operation = this.progressService.startUpload();

        return this.databaseInterface
            .getPendingDownloads()
            .then(keysToCamel)
            .then(downloads => {
                log.info("pending", downloads);
                return serializePromiseChain(
                    downloads,
                    this._uploadDownload.bind(this, operation)
                );
            })
            .then(() => {
                return operation.complete();
            })
            .catch(error => {
                return operation.cancel(error);
            });
    }

    _getFile(path) {
        try {
            log.info("file", File);
            return File.fromPath(path);
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }

    _uploadDownload(operation, download) {
        log.info("uploading", download);

        const headers = {
            "Fk-Blocks": download.blocks,
            "Fk-Generation": download.generation,
            "Fk-Type": download.type
        };

        log.info("headers", headers);
        const file = this._getFile(download.path);
        log.info("file", file);
        return this._upload(download.deviceId, headers, file, operation).then(() => {
            return this.databaseInterface.markDownloadAsUploaded(download);
        });
    }

    _upload(deviceId, headers, file, operation) {
        return new Promise((resolve, reject) => {
            const url = Config.ingestionUri;
            log.info("url", url);

            const session = BackgroundHttp.session(SessionName);
            log.info("session", session);

            delete headers["Connection"];
            delete headers["Content-Length"];

            log.info("uploading", file.path, headers);

            const defaultHeaders = {
                "Content-Type": "application/octet-stream",
                Authorization: this.portalInterface.getCurrentToken(),
                "Fk-DeviceId": deviceId
            };
            const req = {
                url: url,
                method: "POST",
                headers: { ...headers, ...defaultHeaders }
                // androidDisplayNotificationProgress: false, // Won't work going foward.
                // androidRingToneEnabled: false,
                // androidAutoClearNotification: true,
            };
            const task = session.uploadFile(file.path, req);

            task.on("progress", e => {
                const rv = {
                    progress: 100.0 * (e.currentBytes / e.totalBytes),
                    currentBytes: e.currentBytes,
                    totalBytes: e.totalBytes
                };
                operation.update({
                    station: {
                        deviceId: deviceId
                    },
                    progress: Math.round(rv.progress),
                    currentSize: e.currentBytes,
                    totalSize: e.totalBytes
                });
                log.verbose("progress", rv);
            });
            task.on("error", e => {
                log.error("error", e.error);
                reject(e.error);
            });
            task.on("responded", e => {
                const rv = {
                    data: e.data,
                    status: e.responseCode
                };
                log.info("responded", rv);
                // NOTE This was easier than using complete, though I think I'd rather this happen there.
                resolve(rv);
            });
            task.on("complete", e => {
                const rv = {
                    status: e.responseCode
                };
                log.info("complete", rv);
            });

            // Android only
            task.on("cancelled", e => {
                log.info("cancelled", e);
                reject("cancelled");
            });
        });
    }
}
