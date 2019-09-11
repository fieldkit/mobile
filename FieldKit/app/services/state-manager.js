import DownloadManager from "./download-manager";
import UploadManager from "./upload-manager";
import Config from '../config';

const log = Config.logger("StateManager");

export default class StateManager {
    constructor(databaseInterface, queryStation, stationMonitor, portalInterface, progressService) {
        this.databaseInterface = databaseInterface;
        this.queryStation = queryStation;
        this.stationMonitor = stationMonitor;
        this.portalInterface = portalInterface;
        this.downloadManager = new DownloadManager(databaseInterface, queryStation, stationMonitor, progressService);
        this.uploadManager = new UploadManager(databaseInterface, portalInterface, progressService);
    }

    renameStation(station, newName) {
        return this.databaseInterface.setStationName(station).then(() => {
            return this.queryStation.configureName(station.url, newName);
        });
    }

    synchronizeConnectedStations() {
        log("synchronizeConnectedStations");
        return this.downloadManager.synchronizeConnectedStations();
    }

    synchronizePortal() {
        log("synchronizePortal");
        return this.uploadManager.synchronizePortal();
    }

    getStatus() {
        return Promise.all([
            this.downloadManager.getStatus(),
            this.uploadManager.getStatus(),
        ]).then(all => {
            return {
                station: all[0],
                portal: all[1],
            }
        });
    }
}
