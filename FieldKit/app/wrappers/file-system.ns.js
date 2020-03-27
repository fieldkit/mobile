import { Folder, path, File, knownFolders, path as FilePaths } from "tns-core-modules/file-system";

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
        return Promise.resolve(this.f.remove());
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
}

export default class FileSystemNativeScript {
    constructor() {}

    getFolder(path) {
        return new FolderWrapper(knownFolders.documents().getFolder(path));
    }

    getFile(path) {
        return new FileWrapper(path);
    }
}
