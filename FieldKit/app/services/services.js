class DiscoveryEvents {
	constructor() {
		this.listeners = [];
	}

    onFoundService(info) {
        console.log('onServiceFound', info);
		for (let i = 0; i < this.listeners.length; ++i) {
			this.listeners[i].onFoundService(info);
		}
    }

    onLostService(info) {
        console.log('onServiceLost', info);
		for (let i = 0; i < this.listeners.length; ++i) {
			this.listeners[i].onLostService(info);
		}
    }

	add(listener) {
		this.listeners.push(listener);
	}
}

class Services {
    DiscoverStation() {
        if (!this.discoverStation) {
            const DiscoverStation = require("./discover-station").default;
            this.discoverStation = new DiscoverStation();
        }
        return this.discoverStation;
    }

    Diagnostics() {
        if (!this.diagnostics) {
            const Diagnostics = require("./diagnostics-service").default;
            this.diagnostics = new Diagnostics();
        }
        return this.diagnostics;
    }

    Database() {
        if (!this.database) {
            const DatabaseInterface = require("./db-interface").default;
            this.database = new DatabaseInterface();
        }
        return this.database;
    }

    QueryStation() {
        if (!this.queryStation) {
            const QueryStation = require("./query-station").default;
            this.queryStation = new QueryStation();
        }
        return this.queryStation;
    }

    StateManager() {
        if (!this.stateManager) {
            const StateManager = require("./state-manager").default;
            this.stateManager = new StateManager(
                this.Database(),
                this.QueryStation(),
                this.StationMonitor(),
                this.PortalInterface(),
                this.ProgressService()
            );
        }
        return this.stateManager;
    }

    StationMonitor() {
        if (!this.stationMonitor) {
            const StationMonitor = require("./station-monitor").default;
            this.stationMonitor = new StationMonitor(
                this.DiscoverStation(),
                this.Database(),
                this.QueryStation(),
                this.PhoneLocation()
            );
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

    PortalInterface() {
        if (!this.portalInterface) {
            const PortalInterface = require("./portal-interface").default;
            this.portalInterface = new PortalInterface();
        }
        return this.portalInterface;
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
            const Conservify = require("../wrappers/networking").default;
            this.conservify = new Conservify(this.DiscoveryEvents());
        }
        return this.conservify;
	}

	DiscoveryEvents() {
        if (!this.discoveryEvents) {
            this.discoveryEvents = new DiscoveryEvents();
        }
        return this.discoveryEvents;
	}

    PhoneLocation() {
        if (!this.phoneLocation) {
            const PhoneLocation = require("./phone-location").default;
            this.phoneLocation = new PhoneLocation();
        }
        return this.phoneLocation;
    }
}

const services = new Services();

export default services;
