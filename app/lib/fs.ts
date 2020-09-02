import _ from "lodash";
import Promise from "bluebird";
import { Folder, knownFolders } from "tns-core-modules/file-system";

function recurse(f, depth, callback) {
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

export interface FileLike {
    path: string;
    size: number;
    depth: number;
    lastModified: Date;
}

export function listAllFiles(f): Promise<FileLike[]> {
    const files: FileLike[] = [];

    return recurse(f, 0, (depth: number, entry) => {
        // console.log("entry", depth, entry, entry.path, entry.size, entry.lastModified);
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

export function dumpAllFiles() {
    return recurse(knownFolders.documents(), 0, (depth, entry) => {
        console.log("files", entry.path, entry.size);
    });
}
