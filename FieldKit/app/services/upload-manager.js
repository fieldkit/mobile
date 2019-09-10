import Config from '../config';

const log = Config.logger("UploadManager");

export default class UploadManager {
    constructor(databaseInterface) {
        this.databaseInterface = databaseInterface;
    }

    synchronizeLocalData(callbacks) {
        log("synchronizeLocalData");
        return Promise.resolve({});
    }
}
