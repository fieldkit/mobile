import _ from "lodash";
import Config from "../config";
import { serializePromiseChain, onlyAllowEvery } from "../utilities";
import Services from "./services";

const log = Config.logger("StationFirmware");

type ProgressCallback = ({ progress: number }) => void;

function transformProgress(callback: ProgressCallback, fn: (number) => number) {
    if (_.isFunction(callback)) {
        return (total: number, copied: number, info: never) => {
            callback({
                progress: fn((copied / total) * 100.0),
            });
        };
    }
    return () => {};
}

export default class StationFirmware {
    private services: Services;
    public check: () => Promise<any>;

    constructor(services: Services) {
        this.services = services;
        this.check = onlyAllowEvery(
            60,
            () => {
                console.log("firmware check: allowed");
                return this.downloadFirmware(() => {}, false).catch((error) => {
                    console.log("firmware error", error);
                });
            },
            () => {
                console.log("firmware check: throttled");
                return true;
            }
        );
    }

    public downloadFirmware(progressCallback: ProgressCallback, force: boolean): Promise<any> {
        log.info("downloading firmware");
        return this.services
            .PortalInterface()
            .listFirmware("fk-core")
            .then((firmware) => {
                log.info(
                    "firmwares",
                    _.map(firmware.firmwares, (fw) => fw.id)
                );
                return firmware.firmwares.map((f) => {
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
            .then((firmwares) => {
                if (!firmwares || firmwares.length == 0) {
                    log.info("no firmware to download");
                    return;
                }

                return serializePromiseChain(firmwares, (firmware) => {
                    return this.services.Database().addOrUpdateFirmware(firmware);
                })
                    .then(() => {
                        const local = this.services.FileSystem().getFile(firmwares[0].path);
                        if (!local.exists || local.size == 0 || force === true) {
                            log.info("downloading", firmwares[0]);

                            const downloadProgress = transformProgress(progressCallback, (p) => p);

                            return this.services
                                .PortalInterface()
                                .downloadFirmware(firmwares[0].url, firmwares[0].path, downloadProgress)
                                .catch((err) => {
                                    log.error("downloading error:", err);
                                })
                                .then(() => {
                                    return firmwares[0];
                                });
                        }

                        log.info("already have", firmwares[0]);

                        return this.deleteOldFirmware().then(() => {
                            return firmwares[0];
                        });
                    })
                    .then(() => {
                        return firmwares;
                    });
            })
            .then((firmwares) => {
                const ids = _(firmwares).map("id").value();
                return this.services
                    .Database()
                    .deleteAllFirmwareExceptIds(ids)
                    .then((deleted) => {
                        console.log("deleted", deleted);
                        return Promise.all(deleted.map((fw) => this.deleteFirmware(fw)));
                    });
            });
    }

    private deleteFirmware(fw) {
        const local = this.services.FileSystem().getFile(fw.path);
        if (local && local.exists) {
            log.info("removing", fw.path, local.exists, local.size);
            return local.remove();
        }
        return false;
    }

    private async deleteOldFirmware(): Promise<any> {
        await this.services
            .Database()
            .getAllFirmware()
            .then((firmware) => {
                return _(firmware)
                    .tail()
                    .map((fw) => this.deleteFirmware(fw))
                    .value();
            });
    }

    public async cleanupFirmware(): Promise<any> {
        const firmware = await this.services.Database().getAllFirmware();
        const keeping: number[] = [];

        for (const fw of firmware) {
            const local = this.services.FileSystem().getFile(fw.path);
            if (local && local.exists && local.size > 0) {
                log.info("keeping", fw.path, local.exists, local.size);
                keeping.push(fw.id);
            } else {
                log.info("deleting", fw.path, local.exists, local.size);
            }
        }

        await this.services
            .Database()
            .deleteAllFirmwareExceptIds(keeping)
            .then((deleted) => {
                log.info("deleted", deleted);
                return Promise.all(deleted.map((fw) => this.deleteFirmware(fw)));
            });
    }

    public upgradeStation(url: string, progressCallback): Promise<any> {
        log.info("upgrade", url);

        return this.haveFirmware().then((yes) => {
            if (!yes) {
                return Promise.reject(new Error("missingFirmware"));
            }
            return this.services
                .Database()
                .getLatestFirmware()
                .then((firmware) => {
                    log.info("firmware", firmware);

                    const uploadProgress = transformProgress(progressCallback, (p) => p);

                    return this.services.QueryStation().uploadFirmware(url, firmware.path, uploadProgress);
                });
        });
    }

    public haveFirmware(): Promise<any> {
        return this.services
            .Database()
            .getLatestFirmware()
            .then((firmware) => {
                if (!firmware) {
                    return false;
                }
                log.info("firmware", firmware, firmware.path);
                const local = this.services.FileSystem().getFile(firmware.path);
                if (!local.exists || local.size == 0) {
                    log.info("firmware", local.exists, local.size, firmware.path);
                    return false;
                }
                return true;
            });
    }
}
