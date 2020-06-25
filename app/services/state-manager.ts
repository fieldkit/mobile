import _ from "lodash";
import { BetterObservable } from "./rx";
import DownloadManager from "./download-manager";
import UploadManager from "./upload-manager";
import Config from "../config";

const log = Config.logger("StateManager");

export default class StateManager extends BetterObservable {
    private databaseInterface: any;
    private queryStation: any;
    private portalInterface: any;
    private downloadManager: DownloadManager;
    private uploadManager: UploadManager;

    constructor(services) {
        super();
        this.databaseInterface = services.Database();
        this.queryStation = services.QueryStation();
        this.portalInterface = services.PortalInterface();
        this.downloadManager = new DownloadManager(services);
        this.uploadManager = new UploadManager(services);
    }

    start() {
        return Promise.resolve();
    }

    renameStation(station, newName) {
        return this.databaseInterface.setStationName(station).then(() => {
            return this.queryStation.configureName(station.url, newName);
        });
    }

    synchronizeStation(deviceId) {
        log.info("synchronizeStation");
        return this.downloadManager.startSynchronizeStation(deviceId).then(() => {
            log.info("synchronizeStation, refreshing");
            return this.refresh();
        });
    }

    synchronizePortal() {
        log.info("synchronizePortal");
        return this.uploadManager.synchronizePortal().then(() => {
            log.info("synchronizePortal, refreshing");
            return this.refresh();
        });
    }

    getStatus() {
        return Promise.all([this.downloadManager.getStatus(false), this.uploadManager.getStatus()]).then(all => {
            return {
                station: all[0],
                portal: all[1],
            };
        });
    }

    getValue(): Promise<any> {
        return this.getStatus();
    }

    refreshSyncStatus(station) {
        if (this.portalInterface.isLoggedIn()) {
            return this.portalInterface
                .getStationSyncState(station.deviceId)
                .then(summary => {
                    return this.databaseInterface.updateStationFromPortal(station, summary).then(status => {
                        log.info(status);
                    });
                })
                .catch(error => {
                    log.error("error", error, error.stack);
                });
        }
        return Promise.reject();
    }
}
