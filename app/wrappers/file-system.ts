import { Folder, File, knownFolders, path as FilePaths, FileSystemEntity } from "@nativescript/core";
import { FileLike, listAllFiles } from "@/lib/fs";

export class FileWrapper {
    public readonly exists: boolean;
    public readonly f: File | null;
    public readonly size: number;

    constructor(public readonly path: string) {
        this.exists = File.exists(this.path);
        if (this.exists) {
            const f = File.fromPath(this.path);
            if (!f) throw new Error(`no file: ${path}`);
            this.f = f;
            this.size = f.size;
        } else {
            this.f = null;
            this.size = 0;
        }
    }

    public async remove(): Promise<void> {
        if (this.f) {
            await this.f.remove();
        }
    }
}

export class FolderWrapper {
    public readonly path: string;

    constructor(public readonly f: Folder) {
        this.path = f.path;
    }

    public getFile(relative: string): FileWrapper {
        return new FileWrapper(FilePaths.join(this.path, relative));
    }

    public entries(): Promise<FileSystemEntity[]> {
        return this.f.getEntities();
    }
}

export default class FileSystem {
    public getFolder(path: string): FolderWrapper {
        return new FolderWrapper(knownFolders.documents().getFolder(path));
    }

    public getRelativeFile(path: string): FileWrapper {
        return new FileWrapper(knownFolders.documents().getFile(path).path);
    }

    public getFile(path: string): FileWrapper {
        return new FileWrapper(path);
    }

    public listFolder(path: string): Promise<FileLike[]> {
        return listAllFiles(path);
    }
}
