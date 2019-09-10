import DownloadManager from "./download-manager";
import UploadManager from "./upload-manager";
import Config from '../config';

const log = Config.logger("StateManager");

export default class StateManager {
    constructor(databaseInterface, queryStation, stationMonitor) {
        this.databaseInterface = databaseInterface;
        this.queryStation = queryStation;
        this.stationMonitor = stationMonitor;
        this.downloadManager = new DownloadManager(databaseInterface, queryStation, stationMonitor);
        this.uploadManager = new UploadManager(databaseInterface);
    }

    renameStation(station, newName) {
        return this.databaseInterface.setStationName(station).then(() => {
            return this.queryStation.configureName(station.url, newName);
        });
    }

    synchronizeConnectedStations(callbacks) {
        log("synchronizeConnectedStations");
        return this.downloadManager.synchronizeConnectedStations(callbacks);
    }

    synchronizeLocalData(callbacks) {
        log("synchronizeLocalData");
        return this.uploadManager.synchronizeLocalData(callbacks);
    }
}
