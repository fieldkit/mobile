import _ from "lodash";
import { Folder, knownFolders, isAndroid, Utils, File, FileSystemEntity } from "@nativescript/core";

export { File, Folder };

export const DownloadsDirectory = "downloads";

export const DiagnosticsDirectory = "diagnostics";

export interface FileLike {
    path: string;
    depth: number;
    lastModified: Date;
}

export type RecurseCallback = (depth: number, entry: FileSystemEntity) => void;

function recurse(f: Folder, depth: number, callback: RecurseCallback): Promise<void> {
    return f
        .getEntities()
        .then((entities: FileSystemEntity[]) => {
            return Promise.all(
                entities.map((entry: FileSystemEntity) => {
                    if (Folder.exists(entry.path)) {
                        return recurse(Folder.fromPath(entry.path), depth + 1, callback);
                    }
                    return Promise.resolve(callback(depth, entry));
                })
            );
        })
        .then(() => {
            return;
        });
}

function getRelativeMaybe(path: string | null): Folder {
    if (path && path.length > 0) {
        if (path[0] == "/") {
            return Folder.fromPath(path);
        } else {
            return knownFolders.documents().getFolder(path);
        }
    }
    return knownFolders.documents();
}

export function listAllFiles(path: string | null = null): Promise<FileLike[]> {
    const files: FileLike[] = [];
    const folder = getRelativeMaybe(path);
    return recurse(folder, 0, (depth: number, entry: FileSystemEntity) => {
        files.push({
            depth: depth,
            path: entry.path,
            lastModified: entry.lastModified,
        });
    }).then(() => {
        return files;
    });
}

export async function dumpAllFiles(path: string | null, sizes: boolean): Promise<void> {
    const files = await listAllFiles(path);
    const listing = files.map((entry) => {
        if (sizes) {
            const file = File.fromPath(entry.path);
            return {
                path: entry.path,
                size: file.size,
            };
        } else {
            return {
                path: entry.path,
            };
        }
    });

    const logged = { files: listing };
    console.log(`files: ${JSON.stringify(logged)}`);
}

export function getDatabasePath(name: string): string {
    if (isAndroid) {
        // eslint-disable-next-line
        const context = Utils.ad.getApplicationContext();
        // eslint-disable-next-line
        return context.getDatabasePath(name).getAbsolutePath() as string;
    }

    const folder = knownFolders.documents().path;
    return `${folder}/${name}`;
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
