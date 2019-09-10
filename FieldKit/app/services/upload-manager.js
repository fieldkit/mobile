import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";
import * as BackgroundHttp from 'nativescript-background-http';
import { keysToCamel } from '../utilities';
import Config from '../config';

const log = Config.logger("UploadManager");
const SessionName = "fk-data-upload";

export default class UploadManager {
    constructor(databaseInterface) {
        this.databaseInterface = databaseInterface;
    }

    synchronizeLocalData(callbacks) {
        log("synchronizeLocalData");

        return Promise.resolve(this._createServiceModel()).then(uploads => {
        });
    }

    _upload(deviceId, headers, file) {
        return new Promise((resolve, reject) => {
            const url = "http://192.168.0.100:8090/upload";
            const session = BackgroundHttp.session(SessionName);

            delete headers['Connection'];
            delete headers['Content-Length'];

            const defaultHeaders = {
                "Content-Type": "application/octet-stream",
                "Fk-DeviceId": deviceId,
            };
            const req = {
                url: url,
                method: "POST",
                headers: { ...headers, ...defaultHeaders },
            };

            log("uploading", file.path, headers);

            const task = session.uploadFile(file.path, req);

            task.on("progress", (e) => {
                const rv = {
                    progress: 100.0 * (e.currentBytes / e.totalBytes),
                    currentBytes: e.currentBytes,
                    totalBytes: e.totalBytes,
                };
                log('progress', rv);
            });
            task.on("error", (e) => {
                log('error', e);
                reject(e)
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

    _reducePromise(all, fn) {
        return all.reduce((accum, value, index) => {
            return accum.then((allValues) => {
                return fn(value, index).then((singleValue) => {
                    allValues.push(singleValue);
                    return allValues;
                });
            });
        }, Promise.resolve([]));
    }


    _createServiceModel() {
        return this.databaseInterface.getAll().then(keysToCamel).then(stations => {
            return Promise.all(stations.map(station => {
                log("loading", station.deviceId);
                return this._loadStationAndIndex(station);
            })).then(indices => {
                // TODO Calculate total progress.
                return this._reducePromise(indices, this._uploadIndex.bind(this));
            }).then((all) => {
                console.log(all);
            });
        });
    }

    _uploadIndex(stationAndIndex) {
        const { station, index } = stationAndIndex;

        return this._uploadMeta(station, index.meta).then(() => {
            return this._uploadData(station, index.data).then(() => {
                return "done";
            });
        })
    }

    _uploadMeta(station, indexInfo) {
        log("uploading meta", station.deviceId, indexInfo);
        const file = this._getStationFolder(station).getFile("meta.fkpb");
        return this._upload(station.deviceId, indexInfo.headers, file);
    }

    _uploadData(station, indexInfo) {
        log("uploading data", station.deviceId, indexInfo);
        const file = this._getStationFolder(station).getFile("data.fkpb");
        return this._upload(station.deviceId, indexInfo.headers, file);
    }

    _loadStationAndIndex(station) {
        const folder = this._getStationFolder(station);
        const indexFile = folder.getFile("index.json");
        return indexFile.readText("utf8").then(data => {
            try {
                return {
                    station: station,
                    index: JSON.parse(data),
                }
            }
            catch (error) {
                console.log(data);
                return {
                }
            }
        });
    }

    _getStationFolder(station) {
        const data = knownFolders.currentApp();
        return data.getFolder(station.deviceId);
    }
}
