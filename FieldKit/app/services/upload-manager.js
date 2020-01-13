import _ from "lodash";
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";
import { keysToCamel, serializePromiseChain } from "../utilities";
import Services from "./services";
import Config from "../config";

const log = Config.logger("UploadManager");

export default class UploadManager {
    constructor(databaseInterface, portalInterface, progressService) {
        this.databaseInterface = databaseInterface;
        this.portalInterface = portalInterface;
        this.progressService = progressService;
    }

    getStatus() {
        return this.databaseInterface
            .getPendingDownloads()
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
		const url = Config.ingestionUri;
		log.info("url", url);
		log.info("uploading", filePath, headers);

		const defaultHeaders = {
			"Content-Type": "application/octet-stream",
			Authorization: this.portalInterface.getCurrentToken(),
			"Fk-DeviceId": deviceId
		};

		delete headers["connection"];
		delete headers["content-length"];

		return Services.Conservify().upload({
			method: "POST",
			url: url,
			path: filePath,
			headers: { ...headers, ...defaultHeaders },
			progress: (total, copied, info) => {
                operation.updateStation({
					deviceId: deviceId,
					key: filePath, // This is the same key used when generating the progress summary.
                                   // Right now this is local to the deviceId.
                    currentSize: copied,
                    totalSize: total
                });
			}
		}).then(response => {
			if (response.statusCode != 200) {
				return Promise.reject(response);
			}
			return response;
		}, err => {
			return Promise.reject(err);
		});
    }
}
