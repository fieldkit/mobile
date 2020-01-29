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

class WiFiMonitor {
    constructor(services, callback) {
        this.previous = null;
        this.timer = setInterval(() => {
			return services.Conservify().findConnectedNetwork().then((status) => {
				if (status.connectedWifi) {
					log.info("WiFiMonitor: ", status.connectedWifi.ssid);
				}
				else {
					log.info("WiFiMonitor: nothing");
					this.previous = null;
				}
				/*
				const ssid = "";
				if (ssid != this.previous) {
					callback(ssid, this.couldBeStation(ssid));
				}
				this.previous = ssid;
				*/
			});
        }, 10000);

		ConnectivityModule.startMonitoring((newType) => {
			switch (newType) {
			case ConnectivityModule.connectionType.none:
				log.info("connectivity: None");
				break;
			case ConnectivityModule.connectionType.wifi:
				log.info("connectivity: WiFi");
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
		this.wifiMonitor = null;

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

    _watchWifiNetworks() {
		if (this.wifiMonitor != null) {
			return;
		}

        this.wifiMonitor = new WiFiMonitor(this.services, (ssid, couldBeStation) => {
            log.info("new ssid", ssid, couldBeStation);
            if (couldBeStation) {
                this.stationFound({
                    type: "._fk._tcp",
                    name: ssid,
                    host: "192.168.2.1",
                    port: 80
                });
            } else {
                // HACK Fake onLostService for any connection stations.
                const connected = Object.values(this.stations_);
                log.info(connected);
                connected.forEach(station => {
                    this.onLostService({
                        type: station.type,
                        name: station.name
                    });
                });
            }
        });
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
        this._watchWifiNetworks();
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
