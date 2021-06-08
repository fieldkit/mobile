import _ from "lodash";
import Config from "@/config";
import { debug, onlyAllowEvery, logAnalytics } from "@/lib";
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
                debug.log("firmware check: allowed");
                return this.downloadFirmware(() => {
                    // NOOP
                }, false).catch((error) => {
                    debug.log("firmware error", error);
                });
            },
            () => {
                debug.log("firmware check: throttled");
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
                    const relative = `firmware/${moduleName}-${f.id}.bin`;
                    return _.extend(f, {
                        path: relative,
                    });
                });
            });

        if (!remoteFirmware || remoteFirmware.length == 0) {
            log.info("no firmware to download");
            return [];
        }

        for (const firmware of remoteFirmware) {
            await this.services.Database().addOrUpdateFirmware(
                _.extend(
                    {
                        logicalAddress: null,
                    },
                    firmware
                )
            );

            const local = this.services.FileSystem().getRelativeFile(firmware.path);
            if (!local.exists || local.size == 0 || force === true) {
                log.info(`downloading firmware: ${JSON.stringify(firmware)}`);
                const downloadProgress = transformProgress(progressCallback, (p) => p);
                await this.services.PortalInterface().downloadFirmware(firmware.url, firmware.path, downloadProgress);
            } else {
                log.info(`already have: ${JSON.stringify(firmware)}`);
            }
        }

        return remoteFirmware;
    }

    public async downloadFirmware(progressCallback: ProgressCallback = NoopProgress, force = false): Promise<void> {
        const shouldPurge = await this.shouldPurge();
        if (shouldPurge) {
            debug.log("deleting firmware folder");
            await this.services.FileSystem().deleteFolder("firmware");
            debug.log("deleting firmware rows");
            await this.services.Database().deleteAllFirmware();
        }

        const coreBinaries = await this.downloadBinary("fk-core", progressCallback, force);
        const blBinaries = await this.downloadBinary("fk-bl", progressCallback, force);
        const ids = _.concat(coreBinaries, blBinaries).map((f) => f.id);

        const deleted = await this.services.Database().deleteAllFirmwareExceptIds(ids);

        debug.log(`deleted firmware: ${JSON.stringify(deleted)}`);
        await Promise.all(deleted.map((fw) => this.deleteFirmware(fw)));
    }

    private async deleteFirmware(fw: { path: string }): Promise<void> {
        const local = this.services.FileSystem().getRelativeFile(fw.path);
        if (local && local.exists) {
            log.info("removing", fw.path, local.exists, local.size);
            await local.remove();
        }
    }

    public async upgradeStation(url: string, progressCallback: ProgressCallback, firmwareId?: number): Promise<FirmwareResponse> {
        log.info("upgrade", url);

        await logAnalytics("station_upgrade", { url: url });

        return await this.haveFirmware(firmwareId).then((yes: boolean) => {
            if (!yes) {
                return Promise.reject(new Error("missingFirmware"));
            }
            return this.services
                .Database()
                .getFirmware(firmwareId)
                .then((firmware) => {
                    if (!firmware) {
                        log.info("no firmware");
                        return { error: true };
                    }
                    log.info("firmware", firmware);
                    const uploadProgress = transformProgress(progressCallback, (p) => p);
                    const local = this.services.FileSystem().getRelativeFile(firmware.path);
                    return this.services.QueryStation().uploadFirmware(url, local.path, uploadProgress);
                });
        });
    }

    public async haveFirmware(firmwareId?: number): Promise<boolean> {
        const firmware = await this.services.Database().getFirmware(firmwareId);

        if (!firmware) {
            return false;
        }
        log.info("firmware", firmware, firmware.path);
        const local = this.services.FileSystem().getRelativeFile(firmware.path);
        if (!local.exists || local.size == 0) {
            log.info("firmware", local.exists, local.size, firmware.path);
            return false;
        }
        return true;
    }

    private async shouldPurge(): Promise<boolean> {
        const hasBootloader = await this.services.Database().hasBootloader();
        if (!hasBootloader) {
            return true;
        }
        const all = await this.services.Database().getAllFirmware();
        for (const fw of all) {
            if (fw.path[0] == "/") {
                return true;
            }
        }
        return false;
    }
}
