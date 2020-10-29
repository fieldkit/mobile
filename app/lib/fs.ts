import _ from "lodash";
import Promise from "bluebird";
import { Folder, knownFolders, isAndroid, Utils } from "@nativescript/core";

export interface FileLike {
    path: string;
    size: number;
    depth: number;
    lastModified: Date;
}

export type RecurseCallback = (depth: number, entry: FileLike) => void;

function recurse(f: any, depth: number, callback: RecurseCallback) {
    return f.getEntities().then((entities) => {
        return Promise.all(
            entities.map((entry) => {
                if (Folder.exists(entry.path)) {
                    return recurse(Folder.fromPath(entry.path), depth + 1, callback);
                } else {
                    callback(depth, entry);
                }
            })
        );
    });
}

export const DownloadsDirectory = "downloads";
export const DiagnosticsDirectory = "diagnostics";

export function listAllFiles(f: string | null = null): Promise<FileLike[]> {
    const files: FileLike[] = [];

    const getFolder = () => {
        if (f && f.length > 0) {
            return knownFolders.documents().getFolder(f);
        }
        return knownFolders.documents();
    };

    return recurse(getFolder(), 0, (depth: number, entry: FileLike) => {
        files.push({
            depth: depth,
            path: entry.path,
            lastModified: entry.lastModified,
            size: entry.size,
        });
    }).then(() => {
        return files;
    });
}

export function dumpAllFiles(): Promise<void> {
    return recurse(knownFolders.documents(), 0, (depth: number, entry: FileLike) => {
        console.log("files", entry.path, entry.size);
    });
}

export function getDatabasePath(name: string): string {
    if (isAndroid) {
        const context = Utils.ad.getApplicationContext();
        return context.getDatabasePath(name).getAbsolutePath();
    }

    const folder = knownFolders.documents().path;
    return folder + "/" + name;
}

export function getDeviceIdFromPath(path: string): string {
    const relative = path.replace(knownFolders.documents().path + "/", "");
    const parts = relative.split("/");
    const maybeDeviceId = parts[1];
    try {
        Buffer.from(maybeDeviceId, "hex");
        return maybeDeviceId;
    } catch (e) {
        throw new Error(`no device id in path: ${path}`);
    }
}
