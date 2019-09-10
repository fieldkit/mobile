import { Downloader } from 'nativescript-downloader';
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";
import Config from '../config';

const log = Config.logger("DownloadManager");

export default class DownloadManager {
    constructor(databaseInterface, queryStation, stationMonitor) {
        this.databaseInterface = databaseInterface;
        this.queryStation = queryStation;
        this.stationMonitor = stationMonitor;

        // NOTE Can we set these on our instance?
        Downloader.init();
        Downloader.setTimeout(120);
        this.downloader = new Downloader();
    }

    synchronizeConnectedStations(callbacks) {
        log("synchronizeConnectedStations");
        return Promise.resolve(this._createServiceModel()).then(connectedStations => {
            log("connected", connectedStations);
            // NOTE Right now this will download concurrently, we may want to make this serialized.
            return Promise.all(connectedStations.map(s => {
                return this._prepare(s).then(() => {
                    return this._synchronizeStation(s);
                });
            }))
        });
    }

    _prepare(station) {
        log("deleting", station.paths.main);
        // TODO This will eventually be less aggressive.
        return station.paths.main.clear();
    }

    _synchronizeStation(station) {
        return Promise.resolve(station).then(station => {
            return this._download(station.meta.url, station.meta.staging).then(metaInfo => {
                return this._download(station.data.url, station.data.staging).then(dataInfo => {
                    return {
                        meta: metaInfo,
                        data: dataInfo,
                    };
                });
            }).then(infos => {
                log("unstage");
                return this._unstage(station, station.meta, infos).then(() => {
                    return this._unstage(station, station.data, infos);
                }).then(() => {
                    return infos;
                });
            }).then(incoming => {
                // TODO Move this to the database.
                return this._updateIndex(station, incoming);
            }).then(() => {
                log("done");
            });
        });
    }

    _updateIndex(station, incoming) {
        const newIndex = JSON.stringify(incoming);
        console.log("incoming", incoming)
        console.log("index", newIndex)
        return station.paths.index.writeText(newIndex, "utf8");
    }

    _unstage(station, fileServiceModel, info) {
        log("rename", fileServiceModel.final.path);
        return fileServiceModel.staging.rename(fileServiceModel.final.name);
    }

    _download(url, destination) {
        log("download", url, "to", destination);

        const transfer = this.downloader.createDownload({
            url: url,
            path: destination.parent.path,
            fileName: destination.name
        });

        return new Promise((resolve, reject) => {
            // This is what we resolve.
            const res = { };

            this.downloader
                .start(transfer, progress => {
                    log("progress", progress);
                }, headers => {
                    log("headers", headers);
                    res.headers = headers;
                })
                .then(completed => {
                    res.size = destination.size;
                    resolve(res);
                })
                .catch(error => {
                    log("error", error.message);
                    reject(error);
                });
        });
    }

    _createServiceModel() {
        return this.stationMonitor.getStations().filter(s => {
            return s.deviceId && s.url && s.connected;
        }).map(s => {
            const main = this._getStationFolder(s);
            const staging = this._getStagingFolder(s);
            const destinationMeta = main.getFile("meta.fkpb");
            const destinationData = main.getFile("data.fkpb");

            // NOTE NativeScript rename is dumb, gotta keep them in the same directory.
            function toFileModel(urlPath, name) {
                return {
                    url: s.url + urlPath,
                    staging: main.getFile("." + name),
                    final: main.getFile(name),
                };
            }

            return {
                deviceId: s.deviceId,
                url: s.url,
                paths: {
                    main: main,
                    staging: staging,
                    index: main.getFile("index.json"),
                },
                meta: toFileModel("/download/meta", "meta.fkpb"),
                data: toFileModel("/download/data", "data.fkpb"),
            };
        });
    }

    _getStationFolder(station) {
        const data = knownFolders.currentApp();
        return data.getFolder(station.deviceId);
    }


    _getStagingFolder(station) {
        return this._getStationFolder(station).getFolder(".staging");
    }
}
