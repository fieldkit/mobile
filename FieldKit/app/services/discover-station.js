import { Observable, PropertyChangeData } from "tns-core-modules/data/observable";
import * as ConnectivityModule from "tns-core-modules/connectivity";
import { isIOS } from "tns-core-modules/platform";
import { every } from "./rx";

import Config from "../config";
const log = Config.logger("DiscoverStation");

class Station {
    constructor(info) {
        this.scheme = "http";
        this.type = info.type;
        this.name = info.name;
        this.host = info.host;
        this.port = info.port;
        this.url = this.scheme + "://" + this.host + ":" + this.port + "/fk/v1";
    }
}

class NetworkMonitor {
    constructor(services) {
		console.log("NetworkMonitor::ctor");

		this.services = services;
        this.previous = null;
        this.timer = setInterval(() => {
			return services.Conservify().findConnectedNetwork().then((status) => {
				if (status.connectedWifi) {
					log.info("NetworkMonitor: ", status.connectedWifi.ssid);
				}
				else {
					log.info("NetworkMonitor: nothing");
					this.previous = null;
				}
			});
        }, 10000);

		ConnectivityModule.startMonitoring((newType) => {
			try {
				switch (newType) {
				case ConnectivityModule.connectionType.none:
					log.info("connectivity: None");
					break;
				case ConnectivityModule.connectionType.wifi:
					log.info("connectivity: WiFi");
					this.tryFixedAddress();
					break;
				case ConnectivityModule.connectionType.mobile:
					log.info("connectivity: Mobile");
					break;
				case ConnectivityModule.connectionType.ethernet:
					log.info("connectivity: Ethernet");
					break;
				case ConnectivityModule.connectionType.bluetooth:
					log.info("connectivity: Bluetooth");
					break;
				default:
					break;
				}
			}
			catch (e) {
				console.log("error", e);
			}
		});
    }

	tryFixedAddress() {
		const ip = "192.168.2.1";
		this.services.QueryStation().getStatus("http://" + ip + "/fk/v1").then((status) => {
			console.log("found device in ap mode", status.identity.deviceId, status.identity.device);
			this.services.DiscoverStation().onFoundService({
				type: "_fk._tcp",
				name: status.identity.deviceId,
				host: ip,
				port: 80,
			});
		}, () => {
			console.log("no devices in ap mode");
		});
	}

    couldBeStation(ssid) {
        const parts = ssid.split(" ");
        if (parts.length != 3) {
            return false;
        }
        return Number(parts[2]) > 0;
    }
}

export default class DiscoverStation extends Observable {
    constructor(services) {
        super();
		this.services = services;
        this.stations_ = {};
		this.networkMonitor = null;

		this.StationFoundProperty = "stationFound";
		this.StationLostProperty = "stationLost";

		services.DiscoveryEvents().add(this);
    }

    _watchFakePreconfiguredDiscoveries() {
        if (Config.discover && Config.discover.enabled) {
            every(10000).on(Observable.propertyChangeEvent, data => {
                Config.discover.stations.forEach(fake => {
                    this.onFoundService({
                        type: "_fk._tcp",
                        name: fake.deviceId,
                        host: fake.address,
                        port: fake.port,
                    });
                });
            });
        }
    }

	_loseConnectedStations() {
		log.info("loseConnectedStations", this.stations_);
		const connected = Object.values(this.stations_);
		log.info("connected", connected);
		connected.forEach(station => {
			this.onLostService({
				type: station.type,
				name: station.name
			});
		});
	}

    _watchWiFiNetworks() {
		if (this.networkMonitor != null) {
			return;
		}

		console.log("monitoring wifi");

        this.networkMonitor = new NetworkMonitor(this.services);
    }

	subscribeAll(receiver) {
		this.on(Observable.propertyChangeEvent, data => {
			return receiver(data);
		});

		Object.keys(this.stations_).forEach(key => {
			const station = this.stations_[key];
			log.info("publishing known service", station);
			this.onFoundService(station);
		});
	}

    _watchZeroconfAndMdns() {
		return this.services.Conservify().start("_fk._tcp");
    }

    startServiceDiscovery() {
        this._watchFakePreconfiguredDiscoveries();
        this._watchWiFiNetworks();
        this._watchZeroconfAndMdns();
    }

    stopServiceDiscovery() {
        this.stations_ = {};
    }

    onFoundService(info) {
        log.info("found service:", info.type, info.name, info.host, info.port);

        const key = this.makeKey(info);
        const station = new Station(info);
        this.stations_[key] = station;

        this.notifyPropertyChange(this.StationFoundProperty, station);
    }

    onLostService(info) {
        log.info("lost service:", info.type, info.name);
        if (!isIOS && info.type == "_fk._tcp.") {
            info.type = "._fk._tcp";
        }

        const key = this.makeKey(info);
        this.notifyPropertyChange(this.StationLostProperty, this.stations_[key]);

        // don't delete until after it has gone out with notification
        delete this.stations_[key];
    }

    makeKey(station) {
        return station.name + station.type;
    }

	getConnectedStations() {
		return Promise.resolve(this.stations_);
	}
}
