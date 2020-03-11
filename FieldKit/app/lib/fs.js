import _ from "lodash";
import Promise from "bluebird";
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";

function recurse(f, depth, callback) {
    return f.getEntities().then(entities => {
        return Promise.all(
            entities.map(e => {
                if (Folder.exists(e.path)) {
                    return recurse(Folder.fromPath(e.path), depth + 1, callback);
                } else {
                    callback(depth, e.path);
                }
            })
        );
    });
}

export function listAllFiles(f) {
    const files = [];

    return recurse(f, 0, (depth, path) => {
        files.push({
            depth,
            path,
        });
    }).then(() => {
        return files;
    });
}
