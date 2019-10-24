import {
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";
import { Zeroconf } from "nativescript-zeroconf";
import { isIOS } from "tns-core-modules/platform";
import { WifiInfo } from "nativescript-wifi-info";
import { every } from "./rx";
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
        const wifiInfo = new WifiInfo();

        this.previous = null;

        this.timer = setInterval(() => {
            const ssid = wifiInfo.getSSID();
            if (ssid != this.previous) {
                if (false) {
                    callback(ssid, this.couldBeStation(ssid));
                }
            }
            this.previous = ssid;
        }, 1000);
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
        this.zeroconf_ = new Zeroconf("_fk._tcp");
        this.stations_ = {};
    }

    _watchFakePreconfiguredDiscoveries() {
        if (Config.discover && Config.discover.enabled) {
            every(1000).on(Observable.propertyChangeEvent, data => {
                Config.discover.stations.forEach(fake => {
                    this.stationFound({
                        type: "_fck._tcp",
                        name: fake.deviceId,
                        host: fake.address,
                        port: fake.port,
                    });
                });
            });
        }
    }

    _watchWifiNetworks() {
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
                // HACK Fake onServiceLost for any connection stations.
                const connected = Object.values(this.stations_);
                console.log(connected);
                connected.forEach(station => {
                    this.stationLost({
                        type: station.type,
                        name: station.name
                    });
                });
            }
        });
    }

    _watchZeroconf() {
        this.zeroconf_.on(
            Observable.propertyChangeEvent,
            data => {
                switch (data.propertyName.toString()) {
                case "serviceFound": {
                    this.stationFound(data.value);
                    break;
                }
                case "serviceLost": {
                    this.stationLost(data.value);
                    break;
                }
                default: {
                    console.log(
                        data.propertyName.toString() +
                            " " +
                            data.value.toString()
                    );
                    break;
                }
                }
            },
            error => {
                console.log("propertyChangeEvent error", error);
            }
        );
        this.zeroconf_.startServiceDiscovery();
    }

    startServiceDiscovery() {
        this._watchFakePreconfiguredDiscoveries();
        this._watchWifiNetworks();
        this._watchZeroconf();
    }

    stopServiceDiscovery() {
        this.zeroconf_.stopServiceDiscovery();
        this.stations_ = {};
    }

    stationFound(info) {
        console.log(
            "found service:",
            info.type,
            info.name,
            info.host,
            info.port
        );
        const key = this.makeKey(info);
        const station = new Station(info);
        this.stations_[key] = station;
        this.notifyPropertyChange("stationFound", station);
    }

    stationLost(info) {
        console.log("lost service:", info.type, info.name);
        if (!isIOS && info.type == "_fk._tcp.") {
            info.type = "._fk._tcp";
        }
        const key = this.makeKey(info);
        this.notifyPropertyChange("stationLost", this.stations_[key]);
        delete this.stations_[key];
    }

    makeKey(station) {
        return station.name + station.type;
    }
}
