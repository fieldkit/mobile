import { Folder, File, knownFolders, path as FilePaths } from "tns-core-modules/file-system";
import { listAllFiles } from "@/lib/fs";

class FileWrapper {
    constructor(path) {
        this.path = path;
        this.exists = File.exists(this.path);
        if (this.exists) {
            this.f = File.fromPath(this.path);
            this.size = this.f.size;
        } else {
            this.f = null;
            this.size = 0;
        }
    }

    remove() {
        if (this.f) {
            return Promise.resolve(this.f.remove());
        }
        return Promise.resolve();
    }
}

class FolderWrapper {
    constructor(f) {
        this.f = f;
        this.path = f.path;
    }

    getFile(relative) {
        return new FileWrapper(FilePaths.join(this.path, relative));
    }

    entries() {
        return this.f.getEntities();
    }
}

export default class FileSystemNativeScript {
    constructor() {}

    getFolder(path) {
        return new FolderWrapper(knownFolders.documents().getFolder(path));
    }

    getRelativeFile(path) {
        return new FileWrapper(knownFolders.documents().getFile(path));
    }

    getFile(path) {
        return new FileWrapper(path);
    }

    listFolder(path) {
        return listAllFiles(path);
    }
}
