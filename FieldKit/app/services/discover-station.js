import { Observable, PropertyChangeData } from "tns-core-modules/data/observable";
import { isIOS } from "tns-core-modules/platform";
import { every } from "./rx";

import Services from "./services";

import Config from "../config";

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
    constructor(callback) {
        this.previous = null;
        this.timer = setInterval(() => {
			return Services.Conservify().findConnectedNetwork().then((status) => {
				if (status.connectedWifi) {
					console.log("WiFiMonitor: ", status.connectedWifi.ssid);
				}
				else {
					console.log("WiFiMonitor: nothing");
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
    constructor() {
        super();
        this.stations_ = {};
		this.wifiMonitor = null;

		this.StationFoundProperty = "stationFound";
		this.StationLostProperty = "stationLost";

		Services.DiscoveryEvents().add(this);
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

        this.wifiMonitor = new WiFiMonitor((ssid, couldBeStation) => {
            console.log("new ssid", ssid, couldBeStation);
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
                console.log(connected);
                connected.forEach(station => {
                    this.onLostService({
                        type: station.type,
                        name: station.name
                    });
                });
            }
        });
    }

    _watchZeroconfAndMdns() {
		return Services.Conservify().start("_fk._tcp");
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
        console.log("found service:", info.type, info.name, info.host, info.port);

        const key = this.makeKey(info);
        const station = new Station(info);
        this.stations_[key] = station;

        this.notifyPropertyChange(this.StationFoundProperty, station);
    }

    onLostService(info) {
        console.log("lost service:", info.type, info.name);
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
