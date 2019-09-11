import _ from 'lodash';
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";
import * as BackgroundHttp from 'nativescript-background-http';
import { keysToCamel, serializePromiseChain } from '../utilities';
import Config from '../config';

const log = Config.logger("UploadManager");
const SessionName = "fk-data-upload";

export default class UploadManager {
    constructor(databaseInterface, portalInterface, progressService) {
        this.databaseInterface = databaseInterface;
        this.portalInterface  = portalInterface;
        this.progressService = progressService;
    }

    getStatus() {
        return this.databaseInterface.getPendingDownloads().then(pending => {
            return {
                files: pending.length,
                total: _(pending).map('size').sum(),
                devices: _(pending).groupBy('deviceId').size(),
            };
        });
    }

    synchronizePortal() {
        log("synchronizePortal");

        // TODO Replace with connectivity check.
        if (!this.portalInterface.isLoggedIn()) {
            log("offline!");
            return Promise.resolve({
                offline: true,
            });
        }

        const operation = this.progressService.startUpload();

        return this.databaseInterface.getPendingDownloads().then(keysToCamel).then(downloads => {
            return serializePromiseChain(downloads, this._uploadDownload.bind(this, operation));
        }).then(() => {
            return operation.complete();
        }).catch((error) => {
            return operation.cancel(error);
        });
    }

    _uploadDownload(operation, download) {
        const headers = {
            "Fk-Blocks": download.blocks,
        };
        const file = File.fromPath(download.path);
        return this._upload(download.deviceId, headers, file, operation).then(() => {
            return this.databaseInterface.markDownloadAsUploaded(download);
        });
    }

    _upload(deviceId, headers, file, operation) {
        return new Promise((resolve, reject) => {
            const url = Config.ingestionUri;
            const session = BackgroundHttp.session(SessionName);

            delete headers['Connection'];
            delete headers['Content-Length'];

            log("uploading", file.path, headers);

            const defaultHeaders = {
                "Content-Type": "application/octet-stream",
                "Fk-DeviceId": deviceId,
                "Authorization": this.portalInterface.getCurrentToken(),
            };
            const req = {
                url: url,
                method: "POST",
                headers: { ...headers, ...defaultHeaders },
                // androidDisplayNotificationProgress: false, // Won't work going foward.
                // androidRingToneEnabled: false,
                // androidAutoClearNotification: true,
            };
            const task = session.uploadFile(file.path, req);

            task.on("progress", (e) => {
                const rv = {
                    progress: 100.0 * (e.currentBytes / e.totalBytes),
                    currentBytes: e.currentBytes,
                    totalBytes: e.totalBytes,
                };
                operation.update({
                    station: {
                        deviceId: deviceId,
                    },
                    progress: rv.value,
                });
                log('progress', rv);
            });
            task.on("error", (e) => {
                log('error', e.error);
                reject(e.error)
            });
            task.on("responded", (e) => {
                const rv = {
                    data: e.data,
                    status: e.responseCode,
                };
                log('responded', rv);
                // NOTE This was easier than using complete, though I think I'd rather this happen there.
                resolve(rv);
            });
            task.on("complete", (e) => {
                const rv = {
                    status: e.responseCode,
                };
                log('complete', rv);
            });

            // Android only
            task.on("cancelled", (e) => {
                log('cancelled', e);
                reject('cancelled');
            });
        });
    }

    _getStationFolder(station) {
        const data = knownFolders.currentApp();
        return data.getFolder(station.deviceId);
    }
}
