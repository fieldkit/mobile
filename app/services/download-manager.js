import _ from "lodash";
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";

import Services from "./services";
import { Mutex } from "./mutexes";

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
    constructor(services) {
        this.databaseInterface = services.Database();
        this.queryStation = services.QueryStation();
        this.store = services.Store();
        this.progressService = services.ProgressService();
        this._mutex = new Mutex();
    }

    getStatus(connectedOnly) {
        function getDownloadsStatus(streams) {
            if (!_.some(streams)) {
                return {
                    meta: { lastBlock: null, size: 0 },
                    data: { lastBlock: null, size: 0 },
                };
            }

            const stationMeta = _(streams)
                .filter(d => d.type == Constants.MetaStreamType)
                .map(d => {
                    return {
                        size: _.max([d.portalSize || 0, d.downloadSize || 0]),
                        lastBlock: _.max([d.portalLastBlock || 0, d.downloadLastBlock || 0]),
                    };
                })
                .orderBy(d => d.lastBlock);

            const stationData = _(streams)
                .filter(d => d.type == Constants.DataStreamType)
                .map(d => {
                    return {
                        size: _.max([d.portalSize || 0, d.downloadSize || 0]),
                        lastBlock: _.max([d.portalLastBlock || 0, d.downloadLastBlock || 0]),
                    };
                })
                .orderBy(d => d.lastBlock);

            return {
                meta: {
                    lastBlock: stationMeta.last().lastBlock,
                    size: stationMeta.map(s => s.size).sum(),
                },
                data: {
                    lastBlock: stationData.last().lastBlock,
                    size: stationData.map(s => s.size).sum(),
                },
            };
        }

        const stations = Object.values(this.store.getters.legacyStations).filter(s => {
            if (connectedOnly === true) {
                return s.connected;
            }
            return true;
        });

        console.log(
            "refresh stations",
            _.map(stations, s => s.name)
        );

        return Promise.all(
            stations.map(station => {
                if (!station.statusJson()) {
                    console.log("no status json");
                    return {
                        station: station,
                        streams: {
                            meta: {},
                            data: {},
                        },
                        downloads: {},
                        pending: {
                            bytes: 0,
                        },
                    };
                }
                return this.databaseInterface.getStreamsByStationId(station.id).then(streams => {
                    const deviceMeta = this._getStreamStatus(station.statusJson(), 0, Constants.MetaStreamType);
                    const deviceData = this._getStreamStatus(station.statusJson(), 1, Constants.DataStreamType);
                    const downloadStatus = getDownloadsStatus(streams);
                    const pendingMetaBytes = deviceMeta.size - downloadStatus.meta.size;
                    const pendingDataBytes = deviceData.size - downloadStatus.data.size;
                    const pendingMetaRecords = deviceMeta.blocks - downloadStatus.meta.lastBlock;
                    const pendingDataRecords = deviceData.blocks - downloadStatus.data.lastBlock;
                    return {
                        station: station,
                        downloads: downloadStatus,
                        streams: {
                            meta: deviceMeta,
                            data: deviceData,
                        },
                        pending: {
                            bytes: pendingMetaBytes + pendingDataBytes,
                            records: pendingMetaRecords + pendingDataRecords,
                        },
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
        log.verbose("status", status);
        const s = status.streams[index];
        return {
            blocks: s.block,
            size: s.size,
            name: name,
            index: index,
        };
    }

    startSynchronizeStation(deviceId) {
        log.info("startSynchronizeStation", deviceId);

        return this._mutex.tryStart(() => {
            return this._synchronizeConnectedStations(s => s.deviceId == deviceId);
        });
    }

    _synchronizeConnectedStations(stationFilter) {
        log.info("synchronizeConnectedStations");

        return this._createServiceModel().then(connectedStations => {
            log.info("connected", connectedStations);

            const filtered = connectedStations.filter(stationFilter);

            log.info("filtered", filtered);

            return this._summarize(filtered).then(progressSummary => {
                console.log("progressSummary", progressSummary);

                const operation = this.progressService.startDownload(progressSummary);

                // NOTE Right now this will download concurrently, we may want to make this serialized.
                return Promise.all(
                    filtered.map(station => {
                        return this._prepare(station).then(() => {
                            return this._synchronizeStation(station, operation);
                        });
                    })
                )
                    .then(() => {
                        return operation.complete();
                    })
                    .catch(error => {
                        console.log("error", error.message, error.stack);
                        return operation.cancel(error);
                    });
            });
        });
    }

    /**
     * Calculates the total size of all the files to be
     * downloaded. This requires us to query the device for those
     * files to get the actual sizes based on the number of blocks to
     * download. Then we group those by the devices and calculate some
     * sizes. This data structure is taylored to something the
     * ProgressService is expecting. Key's refer to individual
     * transfers, we just use the URL, progress service doesn't care.
     */
    _summarize(stations) {
        return Promise.all(
            stations
                .map(station => {
                    return [
                        this._calculateSize(station.meta.url).then(s => {
                            return {
                                deviceId: station.deviceId,
                                key: station.meta.url,
                                size: s.size,
                            };
                        }),
                        this._calculateSize(station.data.url).then(s => {
                            return {
                                deviceId: station.deviceId,
                                key: station.data.url,
                                size: s.size,
                            };
                        }),
                    ];
                })
                .flat()
        ).then(sizes => {
            return _(sizes)
                .groupBy(s => s.deviceId)
                .map((group, key) => {
                    return {
                        deviceId: key,
                        tasks: _(group)
                            .keyBy(g => g.key)
                            .value(),
                        totalSize: _(group)
                            .map(s => s.size)
                            .sum(),
                    };
                })
                .keyBy(s => s.deviceId)
                .value();
        });
    }

    _calculateSize(url) {
        return Services.QueryStation().calculateDownloadSize(url);
    }

    _prepare(station) {
        // NS File stuff is dumb, the getFile effectively does a touch. So the
        // rename will fail cause there's an empty file sitting there.
        return Promise.all([station.meta.destination.remove(), station.data.destination.remove()]);
    }

    _updateDatabase(station, downloads) {
        return this.databaseInterface.insertDownloads([downloads.meta, downloads.data]);
    }

    _synchronizeStation(station, operation) {
        return this._download(station, station.meta.url, "meta", station.meta.destination, operation)
            .then(metaDownload => {
                return this._download(station, station.data.url, "data", station.data.destination, operation).then(dataDownload => {
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
            throw new Error("Invalid fk-blocks header: " + blocks);
        }

        const parts = blocks
            .split(",")
            .map(s => s.trim())
            .map(s => Number(s));
        if (parts.length != 2) {
            throw new Error("Invalid fk-blocks header: " + blocks);
        }

        return {
            range: parts.join(","),
            firstBlock: parts[0],
            lastBlock: parts[1],
        };
    }

    _createDownloadRow(station, url, type, destination, headers) {
        delete headers["connection"];

        const { range, firstBlock, lastBlock } = this._parseBlocks(headers["fk-blocks"]);
        const generation = headers["fk-generation"];

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
            size: destination.size,
        };
    }

    _download(station, url, type, destination, operation) {
        return Services.QueryStation()
            .download(url, destination.path, (total, copied, info) => {
                return operation.updateStation({
                    deviceId: station.deviceId,
                    key: url,
                    currentSize: copied,
                    totalSize: total,
                });
            })
            .then(response => {
                return this._createDownloadRow(station, url, type, destination, response.headers);
            });
    }

    _createServiceModel() {
        function toFileModel(download, station, urlPath, name, lastDownload) {
            if (lastDownload) {
                return {
                    url: station.url + urlPath + "?first=" + (lastDownload.lastBlock + 1),
                    destination: download.getFile(name),
                };
            }
            return {
                url: station.url + urlPath,
                destination: download.getFile(name),
            };
        }

        return this.getStatus(true).then(status => {
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
                        download: download,
                    },
                    meta: toFileModel(download, station, "/download/meta", "meta.fkpb", downloads.meta),
                    data: toFileModel(download, station, "/download/data", "data.fkpb", downloads.data),
                };
            });
        });
    }

    _getStationFolder(station) {
        return knownFolders.documents().getFolder("FieldKitData").getFolder(station.deviceId);
    }

    _getNewDownloadFolder(station) {
        return this._getStationFolder(station).getFolder(getPathTimestamp());
    }
}
