import _ from "lodash";
import { Device, Folder, File, knownFolders } from "@nativescript/core";
import { copyLogs } from "@/lib/logging";
import { serializePromiseChain } from "@/utilities";
import { DiagnosticsDirectory, getDatabasePath, listAllFiles, dumpAllFiles } from "@/lib/fs";
import { Services } from "@/services";
import Config, { Build } from "@/config";

function uuidv4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export type ProgressFunc = (progress: { id: string; message: string }) => void;

export interface SavedDiagnostics {
    id: string;
    reference: { phrase: string };
}

export default class Diagnostics {
    private readonly baseUrl: string;

    constructor(private readonly services: Services) {
        this.baseUrl = "https://code.conservify.org/diagnostics";
    }

    public upload(progress: ProgressFunc): Promise<SavedDiagnostics> {
        const id = uuidv4();

        console.log("upload diagnostics", id);

        progress({ id: id, message: "Starting..." });

        return Promise.resolve()
            .then(() => dumpAllFiles())
            .then(() => progress({ id: id, message: "Uploading device information." }))
            .then(() => this.uploadDeviceInformation(id))
            .then(() => progress({ id: id, message: "Uploading app logs." }))
            .then(() => this.uploadAppLogs(id))
            .then(() => progress({ id: id, message: "Uploading database." }))
            .then(() => this.uploadDatabase(id))
            .then(() => progress({ id: id, message: "Uploading bundle." }))
            .then(() => this.uploadBundle(id))
            .then((reference: Buffer) =>
                this.uploadArchived().then(
                    (): SavedDiagnostics => {
                        progress({ id: id, message: "Done!" });
                        console.log("diagnostics", JSON.parse(reference.toString()));
                        return {
                            reference: JSON.parse(reference.toString()) as { phrase: string },
                            id: id,
                        };
                    }
                )
            )
            .catch((err) => {
                console.log(`diagnostics error: ${JSON.stringify(err)}`);
                return Promise.reject(err);
            });
    }

    private uploadDeviceInformation(id: string): Promise<void> {
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

        console.log("device info", info);

        return this.services
            .Conservify()
            .text({
                method: "POST",
                url: this.baseUrl + "/" + id + "/device.json",
                body: JSON.stringify(info),
            })
            .then(() => {
                return;
            });
    }

    private uploadArchived(): Promise<void> {
        return this.getAllFiles(DiagnosticsDirectory)
            .then((files) => {
                return serializePromiseChain(files, (path: string) => {
                    const relative = path.replace(DiagnosticsDirectory, "");
                    console.log("uploading", path, relative);
                    return this.services
                        .Conservify()
                        .upload({
                            method: "POST",
                            url: this.baseUrl + relative,
                            path: path,
                        })
                        .then(() => File.fromPath(path).remove());
                });
            })
            .then(() => {
                return;
            });
    }

    private uploadAppLogs(id: string): Promise<void> {
        const copy = this.getDiagnosticsFolder().getFile("uploading.txt");
        return copyLogs(copy).then(() => {
            return this.services
                .Conservify()
                .upload({
                    method: "POST",
                    url: this.baseUrl + "/" + id + "/app.txt",
                    path: copy.path,
                })
                .then(() => File.fromPath(copy.path).remove())
                .then(() => {
                    return;
                });
        });
    }

    private uploadBundle(id: string): Promise<Buffer> {
        const path = knownFolders.documents().getFolder("app").getFile("bundle.js").path;
        console.log("diagnostics", path);
        return this.services
            .Conservify()
            .upload({
                method: "POST",
                url: this.baseUrl + "/" + id + "/bundle.js",
                path: path,
            })
            .then((response) => response.body);
    }

    private uploadDatabase(id: string): Promise<Buffer> {
        console.log("getting database path");
        const path = getDatabasePath("fieldkit.sqlite3");
        console.log("diagnostics", path);
        return this.services
            .Conservify()
            .upload({
                method: "POST",
                url: this.baseUrl + "/" + id + "/fk.db",
                path: path,
                uploadCopy: true,
            })
            .then((response) => response.body);
    }

    private getAllFiles(f: string): Promise<string[]> {
        return listAllFiles(f).then((files) => {
            return _(files)
                .filter((f) => f.depth > 0)
                .map((f) => f.path)
                .value();
        });
    }

    private getDiagnosticsFolder(): Folder {
        return knownFolders.documents().getFolder(DiagnosticsDirectory);
    }
}
