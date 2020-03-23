import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";

class FileWrapper {
    constructor(f) {
        this.f = f;
        this.path = f.path;
        this.size = f.size;
        this.exists = File.exists(this.f.path);
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

    getFile(path) {
        return new FileWrapper(this.f.getFile(path));
    }
}

export default class FileSystemNativeScript {
    constructor() {}

    getFolder(path) {
        return new FolderWrapper(knownFolders.documents().getFolder(path));
    }

    getFile(path) {
        return new FileWrapper(File.fromPath(path));
    }
}
