import Config from "../config";
import storeFactory from "../store";

class DiscoveryEvents {
    constructor() {
        this.listeners = [];
    }

    onFoundService(info) {
        console.log("onServiceFound", info);
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i].onFoundService(info);
        }
    }

    onLostService(info) {
        console.log("onServiceLost", info);
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i].onLostService(info);
        }
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

    StateManager() {
        if (!this.stateManager) {
            const StateManager = require("./state-manager").default;
            this.stateManager = new StateManager(this);
        }
        return this.stateManager;
    }

    StationMonitor() {
        if (!this.stationMonitor) {
            const StationMonitor = require("./station-monitor").default;
            this.stationMonitor = new StationMonitor(this.DiscoverStation(), this.Database(), this.QueryStation(), this.PhoneLocation());
        }
        return this.stationMonitor;
    }

    CreateDb() {
        if (!this.createDb) {
            const CreateDb = require("./create-db").default;
            this.createDb = new CreateDb(this.Database());
        }
        return this.createDb;
    }

    PortalSession() {
        if (!this.portalSession) {
            const PortalSession = require("./portal-session").default;
            this.portalSession = new PortalSession(this);
        }
        return this.portalSession;
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
            this.portalUpdater = new PortalUpdater(this.Database(), this.PortalInterface());
        }
        return this.portalUpdater;
    }

    ProgressService() {
        if (!this.progressService) {
            const ProgressService = require("./progress-service").default;
            this.progressService = new ProgressService();
        }
        return this.progressService;
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
            const PhoneLocation = require("./phone-location").default;
            this.phoneLocation = new PhoneLocation(this.Store());
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
}

const services = new Services();

export default services;
