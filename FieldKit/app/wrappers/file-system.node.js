class File {
	constructor(fs, path) {
		this.fs = fs;
		this.path = path;
	}

	exists() {
		return false;
	}
}

class Folder {
	constructor(fs, path) {
		this.fs = fs;
		this.path = path;
	}

	exists() {
		return false;
	}

	getFile(path) {
		return new File(this.fs, this.path + "/" + path);
	}
}

export default class FileSystemNode {
    constructor() {
    }

	mockFiles(files) {
		this.files = files;
	}

	getFolder(path) {
		return new Folder(this, path);
	}

	getFile(path) {
		return new File(this, path);
	}
}
