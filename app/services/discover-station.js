import { BetterObservable } from "./rx";
import { Connectivity } from "../wrappers/connectivity";
import { every } from "./rx";
import { promiseAfter } from "../utilities";
import { EventHistory } from "./event-history";

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

        this._services = services;
        this._previous = null;
        this._timer = setInterval(() => {
            return services
                .Conservify()
                .findConnectedNetwork()
                .then(status => {
                    if (status.connectedWifi) {
                        log.info("NetworkMonitor: ", status.connectedWifi.ssid);
                    } else {
                        log.info("NetworkMonitor: nothing");
                        this._previous = null;
                    }
                });
        }, 10000);

        Connectivity.startMonitoring(newType => {
            try {
                log.info(newType);
            } catch (e) {
                console.log("NetworkMonitor error:", e);
            }
        });
    }

    tryFixedAddress() {
        const ip = "192.168.2.1";
        this._services
            .QueryStation()
            .getStatus("http://" + ip + "/fk/v1")
            .then(
                status => {
                    console.log("found device in ap mode", status.identity.deviceId, status.identity.device);
                    this._services.DiscoverStation().onFoundService({
                        type: "_fk._tcp",
                        name: status.identity.deviceId,
                        host: ip,
                        port: 80,
                    });
                },
                () => {
                    console.log("no devices in ap mode");
                }
            );
    }

    couldBeStation(ssid) {
        const parts = ssid.split(" ");
        if (parts.length != 3) {
            return false;
        }
        return Number(parts[2]) > 0;
    }
}

export default class DiscoverStation extends BetterObservable {
    constructor(services) {
        super();
        this._services = services;
        this._stations = {};
        this._networkMonitor = null;
        this._history = new EventHistory(this._services.Database());
        this._pending = {};

        this.StationFoundProperty = "stationFound";
        this.StationLostProperty = "stationLost";

        services.DiscoveryEvents().add(this);
    }

    _watchFakePreconfiguredDiscoveries() {
        if (Config.discover && Config.discover.enabled) {
            every(10000).on(BetterObservable.propertyChangeEvent, data => {
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
        log.info("loseConnectedStations", this._stations);
        const connected = Object.values(this._stations);
        log.info("connected", connected);
        connected.forEach(station => {
            this.onLostService({
                type: station.type,
                name: station.name,
            });
        });
    }

    _watchWiFiNetworks() {
        if (this._networkMonitor != null) {
            return;
        }
        this._networkMonitor = new NetworkMonitor(this._services);
    }

    subscribeAll(receiver) {
        this.on(BetterObservable.propertyChangeEvent, data => {
            return receiver(data);
        });

        Object.keys(this._stations).forEach(key => {
            const station = this._stations[key];
            log.info("publishing known service", station);
            this.onFoundService(station);
        });
    }

    _watchZeroconfAndMdns() {
        return this._services.Conservify().start("_fk._tcp");
    }

    startServiceDiscovery() {
        this._watchFakePreconfiguredDiscoveries();
        this._watchWiFiNetworks();
        this._watchZeroconfAndMdns();
    }

    stopServiceDiscovery() {
        this._stations = {};
    }

    onFoundService(info) {
        const key = this.makeKey(info);
        const station = new Station(info);

        log.info("found service:", info.type, info.name, info.host, info.port, key);

        if (this._pending[key]) {
            log.info("cancel pending loss");
            this._pending[key].cancel();
            delete this._pending[key];
        }

        this._stations[key] = station;

        // save the event in our history before we notify the rest of the application.
        return this._history.onFoundStation(info).then(() => {
            return this.notifyPropertyChange(this.StationFoundProperty, station);
        });
    }

    onLostService(info) {
        const key = this.makeKey(info);

        log.info("lost service(pending):", info.type, info.name, Config.lossBufferDelay);

        if (this._pending[key]) {
            this._pending[key].cancel();
            delete this._pending[key];
        }

        return (this._pending[key] = promiseAfter(Config.lossBufferDelay).then(() => {
            log.info("lost service(final):", info.type, info.name);

            delete this._pending[key];

            // save the event in our history before we notify the rest of the application.
            return this._history.onLostStation(info).then(() => {
                const station = this._stations[key];
                if (!station) {
                    log.info("ignoring station, never seen before", key);
                    return Promise.resolve();
                }

                log.info("notify station lost", key);

                const pending = this.notifyPropertyChange(this.StationLostProperty, station);
                // don't delete until after it has gone out with notification
                delete this._stations[key];
                return pending;
            });
        }));
    }

    makeKey(station) {
        return station.name;
    }

    getConnectedStations() {
        return Promise.resolve(this._stations);
    }
}
