import _ from "lodash";
import { Device, Folder, File, knownFolders } from "@nativescript/core";
import { uuidv4, copyLogs } from "@/lib";
import { DiagnosticsDirectory, getRelativeTo, getDatabasePath, listAllFiles, dumpAllFiles } from "@/lib/fs";
import { Services } from "@/services";
import Config, { Build } from "@/config";

export interface DiagnosticsProgress {
    id: string;
    message: string;
    progress?: number;
}

export type ProgressFunc = (progress: DiagnosticsProgress) => void;

export type DeviceInformation = Record<string, unknown>;

export interface Reference {
    phrase: string;
}

export interface SavedDiagnostics {
    id: string;
    reference: Reference;
}

export default class Diagnostics {
    private readonly baseUrl: string;

    constructor(private readonly services: Services) {
        this.baseUrl = "https://code.conservify.org/diagnostics";
    }

    private async prepare(progress: ProgressFunc): Promise<string> {
        const id = uuidv4();

        console.log(`diagnostics-prepare: ${id}`);

        progress({ id: id, message: `Creating Bundle` });

        const folder = this.getDiagnosticsFolder().getFolder(id);

        const path = knownFolders.documents().getFolder("app").getFile("bundle.js").path;

        console.log(`diagnostics-prepare: copying bundle.js (${path})`);
        await this.services.Conservify().copyFile(path, folder.getFile("bundle.js").path);

        progress({ id: id, message: `Writing Device Info` });

        const info = this.gatherDeviceInformation();
        const deviceJson = folder.getFile("device.json");
        console.log(`diagnostics-prepare: writing ${deviceJson.path}`);
        deviceJson.writeTextSync(JSON.stringify(info), (err) => {
            if (err) {
                console.log(`write-error:`, err);
            }
        });

        console.log(`diagnostics:prepare purging old logs`);

        progress({ id: id, message: `Compressing` });

        await this.services.Database().purgeOldLogs();

        progress({ id: id, message: `Copying Database` });

        const databasePath = getDatabasePath("fieldkit.sqlite3");
        const databaseFile = File.fromPath(databasePath);
        console.log(`diagnostics-prepare: database: ${databaseFile.path} ${databaseFile.size}`);
        await this.services.Conservify().copyFile(databasePath, folder.getFile("fk.db").path);

        progress({ id: id, message: `Copying Logs` });

        console.log(`diagnostics-bundle: end of bundle`);

        await copyLogs(folder.getFile("logs.txt"));

        console.log(`diagnostics-bundle:`);

        await dumpAllFiles(folder.path, true);

        console.log(`diagnostics-prepare: ready`);

        return id;
    }

    public async upload(progress: ProgressFunc): Promise<SavedDiagnostics | void> {
        try {
            await dumpAllFiles(null, false);

            const id = await this.prepare(progress);

            console.log(`diagnostics-upload: ${id}`);

            progress({ id: id, message: `Uploading bundle...` });

            /*
            if (true) {
                return {
                    reference: { phrase: "DONE" },
                    id: id,
                };
            }
			*/

            const reference = await this.uploadAll(id, progress);

            progress({ id: id, message: "Done!" });

            console.log(`diagnostics-done: ${JSON.stringify(reference)}`);

            return {
                reference: reference,
                id: id,
            };
        } catch (err: unknown) {
            console.log(`diagnostics error:`, err);
            return Promise.resolve();
        }
    }

    private gatherDeviceInformation(): DeviceInformation {
        const device = Device;

        const info = {
            deviceType: device.deviceType,
            language: device.language,
            manufacturer: device.manufacturer,
            model: device.model,
            os: device.os,
            osVersion: device.osVersion,
            region: device.region,
            sdkVersion: device.sdkVersion,
            uuid: device.uuid,
            config: Config,
            build: Build,
        };

        return info;
    }

    private async uploadAll(id: string, progress: ProgressFunc): Promise<Reference> {
        const files = await this.getAllFiles(DiagnosticsDirectory, 1);
        const filesAndSizes = _(files)
            .map((path) => File.fromPath(path))
            .map((f) => {
                return {
                    path: f.path,
                    size: f.size,
                };
            })
            .sortBy((r) => r.size)
            .value();
        const totalOfAll = _(filesAndSizes)
            .map((r) => r.size)
            .sum();
        const responses: Buffer[] = [];

        let copiedOfAll = 0;

        console.log(`uploading: total=${totalOfAll} files=${JSON.stringify({ files: files })}`);

        for (const row of filesAndSizes) {
            const relative = getRelativeTo(DiagnosticsDirectory, row.path);
            const relativeToDiagnostics = relative.replace(DiagnosticsDirectory, "");
            if (relativeToDiagnostics[0] != "/") throw new Error(`malformed path`);

            console.log(`uploading: path=${row.path} rel=${relative}`);

            try {
                const r = await this.services.Conservify().upload({
                    method: "POST",
                    url: this.baseUrl + relativeToDiagnostics,
                    path: row.path,
                    progress: (_total: number, copied: number) => {
                        progress({ id: id, message: `Uploading`, progress: (copiedOfAll + copied) / totalOfAll });
                    },
                });

                if (r.statusCode != 200) {
                    throw new Error(`unexpected upload status`);
                }

                responses.push(r.body);
                copiedOfAll += row.size;
            } catch (err) {
                console.log(`error uploading file:`, err);
            } finally {
                await File.fromPath(row.path).remove();
            }
        }

        if (responses.length == 0) {
            throw new Error(`empty bundle`);
        }

        return JSON.parse(responses[0].toString()) as Reference;
    }

    private getAllFiles(path: string, minimumDepth: number): Promise<string[]> {
        return listAllFiles(path).then((files) => {
            return _(files)
                .filter((f) => f.depth >= minimumDepth)
                .map((f) => f.path)
                .value();
        });
    }

    private getDiagnosticsFolder(): Folder {
        return knownFolders.documents().getFolder(DiagnosticsDirectory);
    }
}
