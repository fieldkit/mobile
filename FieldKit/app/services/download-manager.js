import _ from "lodash";
import { Downloader } from "nativescript-downloader";
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";

import { keysToCamel, getPathTimestamp } from "../utilities";
import Constants from "../constants";
import Config from "../config";

const log = Config.logger("DownloadManager");

class DownloadStatus {
    constructor(stations) {
        this.stations = stations;
    }

    forStation(id) {
        return _(this.stations)
            .filter(s => s.station.id == id)
            .first();
    }
}

export default class DownloadManager {
    constructor(
        databaseInterface,
        queryStation,
        stationMonitor,
        progressService
    ) {
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
        function getDownloadsStatus(streams) {
            if (!_.some(streams)) {
                return {
                    meta: { lastBlock: null, size: 0 },
                    data: { lastBlock: null, size: 0 }
                };
            }

            const stationMeta = _(streams)
                .filter(d => d.type == Constants.MetaStreamType)
                .map(d => {
                    return {
                        size: _.max([d.portalSize || 0, d.downloadSize || 0]),
                        lastBlock: _.max([
                            d.portalLastBlock || 0,
                            d.downloadLastBlock || 0
                        ])
                    };
                })
                .orderBy(d => d.lastBlock);

            const stationData = _(streams)
                .filter(d => d.type == Constants.DataStreamType)
                .map(d => {
                    return {
                        size: _.max([d.portalSize || 0, d.downloadSize || 0]),
                        lastBlock: _.max([
                            d.portalLastBlock || 0,
                            d.downloadLastBlock || 0
                        ])
                    };
                })
                .orderBy(d => d.lastBlock);

            return {
                meta: {
                    lastBlock: stationMeta.last().lastBlock,
                    size: stationMeta.map(s => s.size).sum()
                },
                data: {
                    lastBlock: stationData.last().lastBlock,
                    size: stationData.map(s => s.size).sum()
                }
            };
        }

        const stations = this.stationMonitor.getStations().filter(s => {
            log.info("url", s.url, "deviceId", s.deviceId);
            return s.deviceId && s.url && s.connected;
        });

        return Promise.all(
            stations.map(keysToCamel).map(station => {
                if (!station.statusReply) {
                    return {
                        station: station,
                        streams: {
                            meta: {},
                            data: {}
                        },
                        downloads: {},
                        pending: {
                            bytes: 0
                        }
                    };
                }
                return this.databaseInterface
                    .getStreamsByStationId(station.id)
                    .then(streams => {
                        const deviceMeta = this._getStreamStatus(
                            station.statusReply,
                            0,
                            Constants.MetaStreamType
                        );
                        const deviceData = this._getStreamStatus(
                            station.statusReply,
                            1,
                            Constants.DataStreamType
                        );
                        const downloadStatus = getDownloadsStatus(streams);
                        const pendingMetaBytes =
                            deviceMeta.size - downloadStatus.meta.size;
                        const pendingDataBytes =
                            deviceData.size - downloadStatus.data.size;
                        const pendingMetaRecords =
                            deviceMeta.blocks - downloadStatus.meta.lastBlock;
                        const pendingDataRecords =
                            deviceData.blocks - downloadStatus.data.lastBlock;

                        return {
                            station: station,
                            downloads: downloadStatus,
                            streams: {
                                meta: deviceMeta,
                                data: deviceData
                            },
                            pending: {
                                bytes: pendingMetaBytes + pendingDataBytes,
                                records: pendingMetaRecords + pendingDataRecords
                            }
                        };
                    });
            })
        ).then(data => {
            return new DownloadStatus(data);
        });
    }

    _getStreamStatus(status, index, name) {
        if (!status.streams) {
            log.info("bad status", status);
            return {};
        }
        log.info("status", status);
        const s = status.streams[index];
        return {
            blocks: s.block,
            size: s.size,
            name: name,
            index: index
        };
    }

    startSynchronizeStation(deviceId) {
        log.info("startSynchronizeStation", deviceId);

        return this._synchronizeConnectedStations(s => s.deviceId == deviceId);
    }

    _synchronizeConnectedStations(stationFilter) {
        log.info("synchronizeConnectedStations");

        const operation = this.progressService.startDownload();

        return this._createServiceModel()
            .then(connectedStations => {
                log.info("connected", connectedStations);
                // NOTE Right now this will download concurrently, we may want to make this serialized.
                return Promise.all(
                    connectedStations.filter(stationFilter).map(station => {
                        return this._prepare(station).then(() => {
                            return this._synchronizeStation(station, operation);
                        });
                    })
                );
            })
            .then(() => {
                return operation.complete();
            })
            .catch(error => {
                return operation.cancel(error);
            });
    }

    _prepare(station) {
        // NS File stuff is dumb, the getFile effectively does a touch. So the
        // rename will fail cause there's an empty file sitting there.
        return Promise.all([
            station.meta.destination.remove(),
            station.data.destination.remove()
        ]);
    }

    _updateDatabase(station, downloads) {
        return this.databaseInterface.insertDownloads([
            downloads.meta,
            downloads.data
        ]);
    }

    _synchronizeStation(station, operation) {
        return this._download(
            station,
            station.meta.url,
            "meta",
            station.meta.destination,
            operation
        )
            .then(metaDownload => {
                return this._download(
                    station,
                    station.data.url,
                    "data",
                    station.data.destination,
                    operation
                ).then(dataDownload => {
                    return { meta: metaDownload, data: dataDownload };
                });
            })
            .then(downloads => {
                return this._updateDatabase(station, downloads);
            });
    }

    _parseBlocks(blocks) {
        if (Array.isArray(blocks)) {
            blocks = blocks[0];
        }

        if (!_.isString(blocks)) {
            throw new Error("Invalid Fk-Blocks header: " + blocks);
        }

        const parts = blocks
            .split(",")
            .map(s => s.trim())
            .map(s => Number(s));
        if (parts.length != 2) {
            throw new Error("Invalid Fk-Blocks header: " + blocks);
        }

        return {
            range: parts.join(","),
            firstBlock: parts[0],
            lastBlock: parts[1]
        };
    }

    _createDownloadRow(station, url, type, destination, headers) {
        delete headers["Connection"];

        const { range, firstBlock, lastBlock } = this._parseBlocks(
            headers["Fk-Blocks"]
        );
        const generation = headers["Fk-Generation"];

        return {
            stationId: station.id,
            deviceId: station.deviceId,
            url: url,
            timestamp: new Date(),
            path: destination.path,
            type: type,
            headers: headers,
            blocks: range,
            generation: generation,
            firstBlock: firstBlock,
            lastBlock: lastBlock,
            size: destination.size
        };
    }

    _download(station, url, type, destination, operation) {
        return new Promise((resolve, reject) => {
            log.info("download", url, "to", destination.path);

            const transfer = this.downloader.createDownload({
                url: url,
                path: destination.parent.path,
                fileName: destination.name
            });

            this.downloader
                .start(transfer, progress => {
                    operation.update({
                        station: {
                            deviceId: station.deviceId
                        },
                        progress: progress.value,
                        currentSize: progress.currentSize,
                        totalSize: progress.totalSize,
                        type: type
                    });
                    log.verbose("progress", progress);
                })
                .then(completed => {
                    log.info("headers", completed.headers);
                    log.info("status", completed.statusCode);
                    resolve(
                        this._createDownloadRow(
                            station,
                            url,
                            type,
                            destination,
                            completed.headers
                        )
                    );
                })
                .catch(error => {
                    log.error("error", error.message);
                    reject(error);
                });
        });
    }

    _createServiceModel() {
        function toFileModel(download, station, urlPath, name, lastDownload) {
            if (lastDownload) {
                return {
                    url:
                        station.url +
                        urlPath +
                        "?first=" +
                        (lastDownload.lastBlock + 1),
                    destination: download.getFile(name)
                };
            }
            return {
                url: station.url + urlPath,
                destination: download.getFile(name)
            };
        }

        return this.getStatus().then(status => {
            return status.stations.map(stationStatus => {
                const { station, downloads, streams } = stationStatus;

                const main = this._getStationFolder(station);
                const download = this._getNewDownloadFolder(station);

                log.verbose("downloads", downloads);
                log.verbose("streams", streams);

                return {
                    id: station.id,
                    deviceId: station.deviceId,
                    url: station.url,
                    paths: {
                        main: main,
                        download: download
                    },
                    meta: toFileModel(
                        download,
                        station,
                        "/download/meta",
                        "meta.fkpb",
                        downloads.meta
                    ),
                    data: toFileModel(
                        download,
                        station,
                        "/download/data",
                        "data.fkpb",
                        downloads.data
                    )
                };
            });
        });
    }

    _getStationFolder(station) {
        return knownFolders
            .currentApp()
            .getFolder("FieldKitData")
            .getFolder(station.deviceId);
    }

    _getNewDownloadFolder(station) {
        return this._getStationFolder(station).getFolder(getPathTimestamp());
    }
}
