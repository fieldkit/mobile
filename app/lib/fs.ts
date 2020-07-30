import _ from "lodash";
import Promise from "bluebird";
import { Folder, knownFolders } from "tns-core-modules/file-system";

function recurse(f, depth, callback) {
    return f.getEntities().then((entities) => {
        return Promise.all(
            entities.map((e) => {
                if (Folder.exists(e.path)) {
                    return recurse(Folder.fromPath(e.path), depth + 1, callback);
                } else {
                    callback(depth, e);
                }
            })
        );
    });
}

export function listAllFiles(f) {
    const files: { path: string; depth: number }[] = [];

    return recurse(f, 0, (depth, entry) => {
        files.push({
            depth: depth,
            path: entry.path,
        });
    }).then(() => {
        return files;
    });
}

export function dumpAllFiles() {
    const rootFolder = knownFolders.documents();
    return recurse(rootFolder, 0, (depth, entry) => {
        console.log("files", entry.path, entry.size);
    });
}
