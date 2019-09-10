import Config from '../config';

function log() {
    if (Config.logging.uploading) {
        console.log.apply(console, arguments);
    }
}

export default class UploadManager {
    constructor(databaseInterface) {
        this.databaseInterface = databaseInterface;
    }

    synchronizeLocalData(callbacks) {
        log("synchronizeLocalData");
        return Promise.resolve({});
    }
}
