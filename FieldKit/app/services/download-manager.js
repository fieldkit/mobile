import { Downloader } from 'nativescript-downloader';
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";
import { getPathTimestamp } from '../utilities';
import Config from '../config';

const log = Config.logger("DownloadManager");

export default class DownloadManager {
    constructor(databaseInterface, queryStation, stationMonitor, progressService) {
        this.databaseInterface = databaseInterface;
        this.queryStation = queryStation;
        this.stationMonitor = stationMonitor;
        this.progressService = progressService;

        // NOTE Can we set these on our instance?
        Downloader.init();
        Downloader.setTimeout(120);
        this.downloader = new Downloader();
    }

    getStatus() {
        return Promise.all(this.stationMonitor.sortStations().map(station => {
            return this.databaseInterface.getDownloadsByStationId(station.id).then(downloads => {
                console.log(station);
                console.log(downloads);
                return {
                    streams: {
                        meta: this._getStreamStatus(station.status_reply, 0, 'meta'),
                        data: this._getStreamStatus(station.status_reply, 1, 'data'),
                    },
                    downloads: {
                        meta: {
                        },
                        data: {
                        }
                    }
                };
            });
        }));
    }

    _getStreamStatus(status, index, name) {
        const s = status.streams[index];
        console.log(s);
        return {
            blocks: s.block,
            size: s.size,
            name: name,
            index: index,
        };
    }

    synchronizeConnectedStations() {
        log("synchronizeConnectedStations");

        const operation = this.progressService.startDownload();

        return Promise.resolve(this._createServiceModel()).then(connectedStations => {
            log("connected", connectedStations);
            // NOTE Right now this will download concurrently, we may want to make this serialized.
            return Promise.all(connectedStations.map(station => {
                return this._prepare(station).then(() => {
                    return this._synchronizeStation(station, operation);
                });
            }))
        }).then(() => {
            return operation.complete();
        }).catch((error) => {
            return operation.cancel(error);
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

    _synchronizeStation(station, operation) {
        return this._download(station, station.meta.url, 'meta', station.meta.destination, operation).then(metaDownload => {
            return this._download(station, station.data.url, 'data', station.data.destination, operation).then(dataDownload => {
                return { meta: metaDownload, data: dataDownload };
            });
        }).then(downloads => {
            return this._updateDatabase(station, downloads);
        });
    }

    _parseBlocks(blocks) {
        if (Array.isArray(blocks)) {
            blocks = blocks[0];
        }

        const parts = blocks.split(",").map(s => s.trim()).map(s => Number(s));
        if (parts.length != 2) {
            throw new Error("Invalid Fk-Blocks header");
        }

        return {
            range: parts.join(","),
            firstBlock: parts[0],
            lastBlock: parts[1],
        };
    }

    _createDownloadRow(station, url, name, destination, headers) {
        delete headers['Connection'];

        const { range, firstBlock, lastBlock } = this._parseBlocks(headers["Fk-Blocks"]);

        return {
            stationId: station.id,
            deviceId: station.deviceId,
            url: url,
            timestamp: new Date(),
            path: destination.path,
            name: name,
            headers: headers,
            blocks: range,
            firstBlock: firstBlock,
            lastBlock: lastBlock,
            size: destination.size,
        };
    }

    _download(station, url, name, destination, operation) {
        return new Promise((resolve, reject) => {
            log("download", url, "to", destination.path);

            const transfer = this.downloader.createDownload({
                url: url,
                path: destination.parent.path,
                fileName: destination.name
            });

            let headers = null;

            this.downloader
                .start(transfer, progress => {
                    operation.update({
                        station: {
                            deviceId: station.deviceId,
                        },
                        progress: progress.value,
                    });
                    log("progress", progress);
                }, h => {
                    headers = h;
                })
                .then(completed => {
                    resolve(this._createDownloadRow(station, url, name, destination, headers));
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
        return knownFolders.currentApp().getFolder(station.deviceId);
    }

    _getNewDownloadFolder(station) {
        return this._getStationFolder(station).getFolder(getPathTimestamp());
    }
}
