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
        return this.databaseInterface
            .getPendingDownloads()
            .then(keysToCamel)
            .then(pending => {
                log.verbose("pending (status)", pending);
                return _(pending)
                    .groupBy('deviceId')
                    .map((record, id) => ({
                        deviceId: id,
                        size: _.sumBy(record, 'size')
                    }))
                    .value();
            })
            .then(uploads => {
                return Promise.all(
                    uploads.map(upload => {
                        return this.databaseInterface
                            .getStationByDeviceId(upload.deviceId)
                            .then(data => {
                                upload.name = data[0].name;
                                return upload;
                            });
                    })
                );
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

        return this.databaseInterface
            .getPendingDownloads()
            .then(keysToCamel)
            .then(downloads => {
                log.info("pending (sync)", downloads);

				return this._summarize(downloads).then(progressSummary => {
					const operation = this.progressService.startUpload(progressSummary);

					return serializePromiseChain(
						downloads,
						this._uploadDownload.bind(this, operation)
					)
					.then(() => {
						return operation.complete();
					})
					.catch(error => {
						return operation.cancel(error);
					});
				});
            });
    }

	_summarize(downloads) {
		const byDevice = _(downloads).
			  groupBy(d => d.deviceId).
			  map((files, key) => {
				  return {
					  deviceId: key,
					  tasks: _(files).
						  map(f => {
							  return {
								  deviceId: key,
								  key: path,
								  path: path,
							  };
						  }).
						  keyBy(r => r.key).
						  value(),
				  };
			  }).
			  keyBy(row => row.deviceId).
			  value();

		return Promise.resolve(byDevice);
	}

    _uploadDownload(operation, download) {
        log.info("uploading", download);

        const headers = {
            "Fk-Blocks": download.blocks,
            "Fk-Generation": download.generation,
            "Fk-Type": download.type
        };

        // This was failing miserably on Bradley's phone.
        // const file = File.fromPath(path);
        return this._upload(download.deviceId, headers, download.path, operation).then(() => {
            return this.databaseInterface.markDownloadAsUploaded(download);
        });
    }

    _upload(deviceId, headers, filePath, operation) {
        return new Promise((resolve, reject) => {
            const url = Config.ingestionUri;
            log.info("url", url);

            const session = BackgroundHttp.session(SessionName);
            log.info("session", session);

            delete headers["Connection"];
            delete headers["Content-Length"];

            log.info("uploading", filePath, headers);

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
            const task = session.uploadFile(filePath, req);

            task.on("progress", e => {
                operation.updateStation({
					deviceId: deviceId,
					key: filePath, // This is the same key used when generating the progress summary.
                                   // Right now this is local to the deviceId.
                    currentSize: e.currentBytes,
                    totalSize: e.totalBytes
                });
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
