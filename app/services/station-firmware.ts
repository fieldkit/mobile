import _ from "lodash";
import Config from "@/config";
import { onlyAllowEvery } from "@/lib";
import { FirmwareResponse, Services } from "@/services";

const log = Config.logger("StationFirmware");

export type TransferProgress = { progress: number };

type ProgressCallback = (tp: TransferProgress) => void;

const NoopProgress: ProgressCallback = (/* { progress: number } */): void => {
    // NOOP
};

function transformProgress(callback: ProgressCallback, fn: (v: number) => number) {
    if (_.isFunction(callback)) {
        return (total: number, copied: number /*, info: never*/) => {
            callback({
                progress: fn((copied / total) * 100.0),
            });
        };
    }
    return () => {
        // NOOP
    };
}

export interface Firmware {
    id: number;
    path: string;
}

export default class StationFirmware {
    private services: Services;
    public check: () => Promise<void>;

    constructor(services: Services) {
        this.services = services;
        this.check = onlyAllowEvery(
            60,
            () => {
                console.log("firmware check: allowed");
                return this.downloadFirmware(() => {
                    // NOOP
                }, false).catch((error) => {
                    console.log("firmware error", error);
                });
            },
            () => {
                console.log("firmware check: throttled");
                return true;
            }
        );
    }

    private async downloadBinary(
        moduleName: string,
        progressCallback: ProgressCallback = NoopProgress,
        force = false
    ): Promise<Firmware[]> {
        const remoteFirmware = await this.services
            .PortalInterface()
            .listFirmware(moduleName)
            .then((firmware) => {
                return firmware.firmwares.map((f) => {
                    const local = this.services.FileSystem().getFolder("firmware").getFile(`${moduleName}-${f.id}.bin`);
                    return _.extend(f, {
                        path: local.path,
                    });
                });
            });

        if (!remoteFirmware || remoteFirmware.length == 0) {
            log.info("no firmware to download");
            return [];
        }

        const firmware = remoteFirmware[0];

        await this.services.Database().addOrUpdateFirmware(
            _.extend(
                {
                    logicalAddress: null,
                },
                firmware
            )
        );

        const local = this.services.FileSystem().getFile(firmware.path);
        if (!local.exists || local.size == 0 || force === true) {
            log.info(`downloading firmware: ${JSON.stringify(firmware)}`);
            const downloadProgress = transformProgress(progressCallback, (p) => p);
            await this.services.PortalInterface().downloadFirmware(firmware.url, firmware.path, downloadProgress);
        } else {
            log.info(`already have: ${JSON.stringify(firmware)}`);
        }

        return [firmware];
    }

    public async downloadFirmware(progressCallback: ProgressCallback = NoopProgress, force = false): Promise<void> {
        const hasBootloader = await this.services.Database().hasBootloader();
        if (!hasBootloader) {
            console.log("deleting firmware folder");
            await this.services.FileSystem().deleteFolder("firmware");
            console.log("deleting firmware rows");
            await this.services.Database().deleteAllFirmware();
        }

        const coreBinaries = await this.downloadBinary("fk-core", progressCallback, force);
        const blBinaries = await this.downloadBinary("fk-bl", progressCallback, force);
        const ids = _.concat(coreBinaries, blBinaries).map((f) => f.id);

        const deleted = await this.services.Database().deleteAllFirmwareExceptIds(ids);

        console.log(`deleted firmware: ${JSON.stringify(deleted)}`);
        await Promise.all(deleted.map((fw) => this.deleteFirmware(fw)));
    }

    private async deleteFirmware(fw: { path: string }): Promise<void> {
        const local = this.services.FileSystem().getFile(fw.path);
        if (local && local.exists) {
            log.info("removing", fw.path, local.exists, local.size);
            await local.remove();
        }
    }

    public async cleanupFirmware(): Promise<void> {
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

    public upgradeStation(url: string, progressCallback: ProgressCallback): Promise<FirmwareResponse> {
        log.info("upgrade", url);

        return this.haveFirmware().then((yes: boolean) => {
            if (!yes) {
                return Promise.reject(new Error("missingFirmware"));
            }
            return this.services
                .Database()
                .getLatestFirmware()
                .then((firmware) => {
                    if (!firmware) {
                        log.info("no firmware");
                        return { error: true };
                    }
                    log.info("firmware", firmware);
                    const uploadProgress = transformProgress(progressCallback, (p) => p);
                    return this.services.QueryStation().uploadFirmware(url, firmware.path, uploadProgress);
                });
        });
    }

    public haveFirmware(): Promise<boolean> {
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
