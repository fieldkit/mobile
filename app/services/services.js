import Config from "../config";
import storeFactory from "../store";

class DiscoveryEvents {
    constructor() {
        this.listeners = [];
    }

    onFoundService(info) {
        // console.log("onServiceFound", info);
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i].onFoundService(info);
        }
        // console.log("onServiceFound (done)");
    }

    onLostService(info) {
        // console.log("onServiceLost", info);
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i].onLostService(info);
        }
        // console.log("onServiceLost (done)");
    }

    add(listener) {
        this.listeners.push(listener);
    }
}

export class Services {
    Store() {
        if (!this.store) {
            this.store = storeFactory();
        }
        return this.store;
    }

    DiscoverStation() {
        if (!this.discoverStation) {
            const DiscoverStation = require("./discover-station").default;
            this.discoverStation = new DiscoverStation(this);
        }
        return this.discoverStation;
    }

    Diagnostics() {
        if (!this.diagnostics) {
            const Diagnostics = require("./diagnostics-service").default;
            this.diagnostics = new Diagnostics(this);
        }
        return this.diagnostics;
    }

    Database() {
        if (!this.database) {
            const DatabaseInterface = require("./db-interface").default;
            this.database = new DatabaseInterface(this);
        }
        return this.database;
    }

    QueryStation() {
        if (!this.queryStation) {
            const QueryStation = require("./query-station").default;
            this.queryStation = new QueryStation(this);
        }
        return this.queryStation;
    }

    CreateDb() {
        if (!this.createDb) {
            const CreateDb = require("./create-db").default;
            this.createDb = new CreateDb(this.Database());
        }
        return this.createDb;
    }

    PortalInterface() {
        if (!this.portalInterface) {
            const PortalInterface = require("./portal-interface").default;
            this.portalInterface = new PortalInterface(this);
        }
        return this.portalInterface;
    }

    PortalUpdater() {
        if (!this.portalUpdater) {
            const PortalUpdater = require("./portal-updater").default;
            this.portalUpdater = new PortalUpdater(this.PortalInterface(), this.Store());
        }
        return this.portalUpdater;
    }

    Conservify() {
        if (!this.conservify) {
            const logger = Config.logger("NativeScriptConservify").info;
            const Conservify = require("../wrappers/networking").default;
            this.conservify = new Conservify(this.DiscoveryEvents(), logger);
        }
        return this.conservify;
    }

    DiscoveryEvents() {
        if (!this.discoveryEvents) {
            this.discoveryEvents = new DiscoveryEvents(this);
        }
        return this.discoveryEvents;
    }

    PhoneLocation() {
        if (!this.phoneLocation) {
            const PhoneLocationWatcher = require("./phone-location").default;
            this.phoneLocation = new PhoneLocationWatcher(this.Store());
        }
        return this.phoneLocation;
    }

    StationFirmware() {
        if (!this.stationFirmware) {
            const StationFirmware = require("./station-firmware").default;
            this.stationFirmware = new StationFirmware(this);
        }
        return this.stationFirmware;
    }

    FileSystem() {
        if (!this.fileSystem) {
            const FileSystem = require("../wrappers/file-system").default;
            this.fileSystem = new FileSystem();
        }
        return this.fileSystem;
    }

    CalibrationService() {
        if (!this.calibrationService) {
            const CalibrationService = require("./calibration-service").default;
            this.calibrationService = new CalibrationService(this);
        }
        return this.calibrationService;
    }

    OnlineStatus() {
        if (!this.onlineStatus) {
            const OnlineStatus = require("./online-status").default;
            this.onlineStatus = new OnlineStatus(this);
        }
        return this.onlineStatus;
    }

    Audio() {
        if (!this.audioInterface) {
            const AudioInterface = require("./audio-interface").default;
            this.audioInterface = new AudioInterface(this);
        }
        return this.audioInterface;
    }

    Images() {
        if (!this.images) {
            const ImagesSaver = require("./images-saver").default;
            this.images = new ImagesSaver(this);
        }
        return this.images;
    }
}

const services = new Services();

export default services;
