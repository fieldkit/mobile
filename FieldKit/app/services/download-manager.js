import { Downloader } from 'nativescript-downloader';
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";
import { getPathTimestamp } from '../utilities';
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

    synchronizeConnectedStations() {
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
        // NS File stuff is dumb, the getFile effectively does a touch. So the
        // rename will fail cause there's an empty file sitting there.
        return Promise.all([
            station.meta.destination.remove(),
            station.data.destination.remove(),
        ]);
    }

    _updateDatabase(station, downloads) {
        return this.databaseInterface.insertDownloads([
            downloads.meta,
            downloads.data,
        ]);
    }

    _synchronizeStation(station) {
        return this._download(station, station.meta.url, station.meta.destination).then(metaDownload => {
            return this._download(station, station.data.url, station.data.destination).then(dataDownload => {
                return { meta: metaDownload, data: dataDownload };
            });
        }).then(downloads => {
            return this._updateDatabase(station, downloads);
        });
    }

    _download(station, url, destination) {
        log("download", url, "to", destination.path);

        const transfer = this.downloader.createDownload({
            url: url,
            path: destination.parent.path,
            fileName: destination.name
        });

        return new Promise((resolve, reject) => {
            // This is what we resolve.
            const res = {
                stationId: station.id,
                deviceId: station.deviceId,
                url: url,
                timestamp: new Date(),
                path: destination.path,
            };

            this.downloader
                .start(transfer, progress => {
                    log("progress", progress);
                }, headers => {
                    log("headers", headers);
                    delete headers['Connection'];
                    res.headers = headers;
                    res.blocks = headers['Fk-Blocks'];
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
            const download = this._getNewDownloadFolder(s);

            function toFileModel(urlPath, name) {
                return {
                    url: s.url + urlPath,
                    destination: download.getFile(name),
                };
            }

            return {
                id: s.id,
                deviceId: s.deviceId,
                url: s.url,
                paths: {
                    main: main,
                    download: download,
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

    _getNewDownloadFolder(station) {
        return this._getStationFolder(station).getFolder(getPathTimestamp());
    }
}
