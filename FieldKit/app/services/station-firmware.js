import _ from "lodash";
import Config from "../config";
import { serializePromiseChain } from "../utilities";

const log = Config.logger("StationFirmware");

function transformProgress(callback, fn) {
    if (_.isFunction(callback)) {
        return (total, copied, info) => {
            callback({
                progress: fn((copied / total) * 100.0),
            });
        };
    }
    return () => {};
}

export default class StationUpgrade {
    constructor(services) {
        this.services = services;
    }

    downloadFirmware(progressCallback, force) {
        return this.services
            .PortalInterface()
            .listFirmware("fk-core")
            .then(firmware => {
                return firmware.firmwares.map(f => {
                    const local = this.services
                        .FileSystem()
                        .getFolder("firmware")
                        .getFile("fk-bundled-fkb-" + f.id + ".bin");
                    log.verbose("local", local);
                    return _.extend(f, {
                        path: local.path,
                    });
                });
            })
            .then(firmwares => {
                if (!firmwares || firmwares.length == 0) {
                    log.info("no firmware");
                    return;
                }

                return serializePromiseChain(firmwares, firmware => {
                    return this.services.Database().addOrUpdateFirmware(firmware);
                })
                    .then(() => {
                        const local = this.services.FileSystem().getFile(firmwares[0].path);
                        if (!local.exists || local.size == 0 || force === true) {
                            log.info("downloading", firmwares[0]);

                            const downloadProgress = transformProgress(progressCallback, p => p);

                            return this.services
                                .PortalInterface()
                                .downloadFirmware(firmwares[0].url, firmwares[0].path, downloadProgress)
                                .catch(err => {
                                    log.error("downloading error:", err);
                                })
                                .then(() => {
                                    return firmwares[0];
                                });
                        }

                        log.info("already have", firmwares[0]);

                        return this._deleteOldFirmware().then(() => {
                            return firmwares[0];
                        });
                    })
                    .then(() => {
                        return firmwares;
                    });
            })
            .then(firmwares => {
                const ids = _(firmwares)
                    .map("id")
                    .value();
                return this.services
                    .Database()
                    .deleteAllFirmwareExceptIds(ids)
                    .then(deleted => {
                        console.log("deleted", deleted);
                        return Promise.all(deleted.map(fw => this._deleteFirmware(fw)));
                    });
            });
    }

    _deleteFirmware(fw) {
        const local = this.services.FileSystem().getFile(fw.path);
        if (local && local.exists) {
            log.info("removing", fw.path, local.exists, local.size);
            return local.remove();
        }
        return false;
    }

    _deleteOldFirmware() {
        return this.services
            .Database()
            .getAllFirmware()
            .then(firmware => {
                return _(firmware)
                    .tail()
                    .map(fw => this._deleteFirmware(fw))
                    .value();
            });
    }

    upgradeStation(url, progressCallback) {
        log.info("upgrade", url);

        return this.haveFirmware().then(yes => {
            if (!yes) {
                return Promise.reject("missingFirmware");
            }
            return this.services
                .StationMonitor()
                .getKnownStations()
                .then(knownStations => {
                    return this.services
                        .Database()
                        .getLatestFirmware()
                        .then(firmware => {
                            log.info("firmware", firmware);

                            const uploadProgress = transformProgress(progressCallback, p => p);

                            return this.services.QueryStation().uploadFirmware(url, firmware.path, uploadProgress);
                        });
                });
        });
    }

    haveFirmware() {
        return this.services
            .Database()
            .getLatestFirmware()
            .then(firmware => {
                log.info("firmware", firmware);

                if (!firmware) {
                    return false;
                }

                const local = this.services.FileSystem().getFile(firmware.path);
                if (!local.exists || local.size == 0) {
                    return false;
                }
                return true;
            });
    }
}
