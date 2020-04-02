import _ from "lodash";
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";
import { keysToCamel, serializePromiseChain } from "../utilities";
import Services from "./services";
import Config from "../config";
import { Mutex } from "./mutexes";

const log = Config.logger("UploadManager");

export default class UploadManager {
    constructor(services) {
        this.databaseInterface = services.Database();
        this.portalInterface = services.PortalInterface();
        this.progressService = services.ProgressService();
        this.fileSystem = services.FileSystem();
        this._mutex = new Mutex();
    }

    getUri() {
        return this.databaseInterface.getConfig().then(config => {
            return config[0].ingestionUri;
        });
    }

    getStatus() {
        return this.databaseInterface
            .getPendingDownloads()
            .then(pending => {
                log.verbose("pending (status)", pending);
                return _(pending)
                    .groupBy("deviceId")
                    .map((record, id) => ({
                        deviceId: id,
                        size: _.sumBy(record, "size"),
                    }))
                    .value();
            })
            .then(uploads => {
                return Promise.all(
                    uploads.map(upload => {
                        // NOTE Name is on pending downloads, now.
                        return this.databaseInterface.getStationByDeviceId(upload.deviceId).then(data => {
                            upload.name = data[0].name;
                            return upload;
                        });
                    })
                );
            });
    }

    _onlyIfOnline() {
        if (!this.portalInterface.isLoggedIn()) {
            log.info("offline!");
            return Promise.reject({
                offline: true,
            });
        }

        // TODO Make this isAvailable eventually, this is to force a token refresh.
        return this.portalInterface.storeCurrentUser().then(_ => {
            return this.portalInterface.isAvailable().then(yes => {
                if (!yes) {
                    return Promise.reject({
                        offline: true,
                    });
                }
                return true;
            });
        });
    }

    synchronizePortal() {
        log.info("synchronizePortal");

        return this._onlyIfOnline().then(() => {
            return this._mutex.tryStart(() => {
                return this.databaseInterface.getPendingDownloads().then(downloads => {
                    log.info("pending (sync)", downloads);

                    return this._summarize(downloads).then(progressSummary => {
                        const operation = this.progressService.startUpload(progressSummary);

                        return serializePromiseChain(downloads, this._uploadDownload.bind(this, operation))
                            .then(() => {
                                return operation.complete();
                            })
                            .catch(error => {
                                return operation.cancel(error);
                            });
                    });
                });
            });
        });
    }

    _summarize(downloads) {
        const byDevice = _(downloads)
            .groupBy(d => d.deviceId)
            .map((files, key) => {
                return {
                    deviceId: key,
                    tasks: _(files)
                        .map(f => {
                            return {
                                deviceId: key,
                                key: path,
                                path: path,
                            };
                        })
                        .keyBy(r => r.key)
                        .value(),
                };
            })
            .keyBy(row => row.deviceId)
            .value();

        return Promise.resolve(byDevice);
    }

    _uploadDownload(operation, download) {
        log.info("uploading", download);

        const headers = {
            "Fk-Blocks": download.blocks,
            "Fk-Generation": download.generation,
            "Fk-Type": download.type,
        };

        // This was failing miserably on Bradley's phone.
        // const file = File.fromPath(path);
        return this._upload(download.deviceId, download.name, headers, download.path, operation).then(() => {
            return this.databaseInterface.markDownloadAsUploaded(download);
        });
    }

    _upload(deviceId, deviceName, headers, filePath, operation) {
        log.info("uploading", filePath, headers);

        const local = this.fileSystem.getFile(filePath);

        if (!local.exists || local.size == 0) {
            log.info("skipping", local.exists, local.size);
            return Promise.resolve();
        }

        log.info("local", local.exists, local.size);

        const defaultHeaders = {
            "Content-Type": "application/octet-stream",
            Authorization: this.portalInterface.getCurrentToken(),
            "Fk-DeviceId": deviceId,
            "Fk-DeviceName": deviceName,
        };

        delete headers["connection"];
        delete headers["content-length"];

        return this.getUri().then(url =>
            Services.Conservify()
                .upload({
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
                            totalSize: total,
                        });
                    },
                })
                .then(
                    response => {
                        if (response.statusCode != 200) {
                            return Promise.reject(response);
                        }
                        return response;
                    },
                    err => {
                        return Promise.reject(err);
                    }
                )
        );
    }
}
