import { FileLike } from "@/lib/fs";

export class FileWrapper {
    public readonly size: number;
    public readonly exists: boolean;

    constructor(public readonly fs: FileSystem, public readonly path: string) {
        this.size = 100;
        this.exists = false;
    }

    public remove(): Promise<void> {
        return Promise.resolve();
    }
}

export class FolderWrapper {
    constructor(public readonly fs: FileSystem, public readonly path: string) {}

    public getFile(path: string): FileWrapper {
        return new FileWrapper(this.fs, this.path + "/" + path);
    }

    public entries(): any[] {
        return [];
    }
}

export default class FileSystem {
    public getFolder(path: string): FolderWrapper {
        return new FolderWrapper(this, path);
    }

    public getRelativeFile(path: string): FileWrapper {
        return new FileWrapper(this, path);
    }

    public getFile(path: string): FileWrapper {
        return new FileWrapper(this, path);
    }

    public listFolder(path: string): Promise<FileLike[]> {
        return Promise.resolve([]);
    }
}
