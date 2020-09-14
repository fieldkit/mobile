import _ from "lodash";
import * as platform from "tns-core-modules/platform";
import { File, knownFolders } from "tns-core-modules/file-system";
import { copyLogs } from "../lib/logging";
import { serializePromiseChain } from "../utilities";
import { DiagnosticsDirectory, getDatabasePath, listAllFiles, dumpAllFiles } from "../lib/fs";
import Config, { Build } from "../config";

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export default class Diagnostics {
    readonly services: any;
    readonly baseUrl: string;

    constructor(services) {
        this.services = services;
        this.baseUrl = "https://code.conservify.org/diagnostics";
    }

    upload(progress) {
        const id = uuidv4();

        console.log("upload diagnostics", id);

        progress({ id: id, message: "Starting..." });

        return Promise.resolve(true)
            .then(() => dumpAllFiles())
            .then(() => progress({ id: id, message: "Uploading device information." }))
            .then(() => this.uploadDeviceInformation(id))
            .then(() => progress({ id: id, message: "Uploading app logs." }))
            .then(() => this.uploadAppLogs(id))
            .then(() => progress({ id: id, message: "Uploading database." }))
            .then(() => this.uploadDatabase(id))
            .then((reference) =>
                this.uploadArchived().then(() => {
                    progress({ id: id, message: "Done!" });
                    console.log("diagnostics", JSON.parse(reference));
                    return {
                        reference: JSON.parse(reference),
                        id: id,
                    };
                })
            )
            .catch((err) => {
                console.log(`diagnostics error: ${err}`);
            });
    }

    private uploadDeviceInformation(id) {
        const device = platform.device;

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

        return this.services.Conservify().text({
            method: "POST",
            url: this.baseUrl + "/" + id + "/device.json",
            body: JSON.stringify(info),
        });
    }

    private uploadArchived() {
        return this.getAllFiles(DiagnosticsDirectory).then((files) => {
            return serializePromiseChain(files, (path, index) => {
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
        });
    }

    private uploadAppLogs(id) {
        const copy = this.getDiagnosticsFolder().getFile("uploading.txt");
        return copyLogs(copy).then(() => {
            return this.services
                .Conservify()
                .upload({
                    method: "POST",
                    url: this.baseUrl + "/" + id + "/app.txt",
                    path: copy.path,
                })
                .then(() => {
                    return File.fromPath(copy.path).remove();
                });
        });
    }

    private uploadDatabase(id) {
        console.log("getting database path");
        const path = getDatabasePath("fieldkit.sqlite3");
        console.log("diagnostics", path);
        return this.services
            .Conservify()
            .upload({
                method: "POST",
                url: this.baseUrl + "/" + id + "/fk.db",
                path: path,
            })
            .then((response) => response.body);
    }

    private getAllFiles(f: string): Promise<any> {
        return listAllFiles(f).then((files) => {
            return _(files)
                .filter((f) => f.depth > 0)
                .map((f) => f.path)
                .value();
        });
    }

    private getDiagnosticsFolder() {
        return knownFolders.documents().getFolder(DiagnosticsDirectory);
    }
}
