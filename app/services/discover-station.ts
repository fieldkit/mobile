import { BetterObservable } from "./rx";
import { Connectivity } from "../wrappers/connectivity";
import { every } from "./rx";
import { promiseAfter } from "../utilities";
import { EventHistory } from "./event-history";

import * as ActionTypes from "@/store/actions";
import * as MutationTypes from "@/store/mutations";

import Config from "../config";

const log = Config.logger("DiscoverStation");

class Station {
    public readonly scheme: string = "http";
    public readonly type: string;
    public readonly name: string;
    public readonly deviceId: string;
    public readonly host: string;
    public readonly port: number;
    public readonly url: string;

    constructor(info: FoundService) {
        this.scheme = "http";
        this.type = info.type;
        this.name = info.name;
        this.deviceId = info.name;
        this.host = info.host;
        this.port = info.port;
        this.url = this.scheme + "://" + this.host + ":" + this.port + "/fk/v1";
    }

    public get found(): FoundService {
        return new FoundService(this.type, this.name, this.host, this.port);
    }
}

class NetworkMonitor {
    _services: any;
    _stations: any;
    _store: any;
    _timer: any;

    constructor(services) {
        this._services = services;
        this._store = services.Store();
        this._timer = setInterval(() => {
            return services
                .Conservify()
                .findConnectedNetwork()
                .then((status) => {
                    this._store.commit(MutationTypes.PHONE_NETWORK, status.connectedWifi);
                });
        }, 10000);

        Connectivity.startMonitoring((newType) => {
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
                (status) => {
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

export class FoundService {
    constructor(public readonly type: string, public readonly name: string, public readonly host: string, public readonly port: number) {}
}

export class LostService {
    constructor(public readonly type: string, public readonly name: string) {}
}

export default class DiscoverStation {
    _services: any;
    _store: any;
    _conservify: any;
    _pending: { [index: string]: any };
    _timer: any;
    _history: any;
    _networkMonitor: NetworkMonitor;
    _stations: { [index: string]: Station } = {};
    _started = false;

    constructor(services) {
        this._services = services;
        this._store = services.Store();
        this._conservify = services.Conservify();
        this._history = new EventHistory(this._services.Database());
        this._pending = {};
        this._networkMonitor = new NetworkMonitor(this._services);
        this._started = false;

        services.DiscoveryEvents().add(this);
    }

    public started() {
        return this._started;
    }

    private watchFakePreconfiguredDiscoveries() {
        if (Config.discover && Config.discover.enabled) {
            every(10000).on(BetterObservable.propertyChangeEvent, (data) => {
                Config.discover.stations.forEach((fake) => {
                    this.onFoundService(new FoundService("_fk._tcp", fake.deviceId, fake.address, fake.port));
                });
            });
        }
    }

    public restart() {
        return this.stopServiceDiscovery().then(() => {
            return this.startServiceDiscovery();
        });
    }

    public startServiceDiscovery() {
        if (this._started) {
            return Promise.resolve(true);
        }
        this._started = true;
        this.watchFakePreconfiguredDiscoveries();
        return this._conservify.start("_fk._tcp");
    }

    public stopServiceDiscovery() {
        this._started = false;
        this._stations = {};
        return Promise.resolve(this._conservify.stop());
    }

    protected onFoundService(info: FoundService): Promise<any> {
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
        return this._history
            .onFoundStation(info)
            .then(() => this._store.dispatch(ActionTypes.FOUND, { url: station.url, deviceId: station.deviceId }));
    }

    protected onLostService(info: LostService): Promise<any> {
        const key = this.makeKey(info);

        if (!this._stations[key]) {
            log.info("lose service (pending, unknown):", info.type, info.name, Config.lossBufferDelay);
        } else {
            log.info("lose service (pending):", info.type, info.name, Config.lossBufferDelay);
        }

        if (this._pending[key]) {
            this._pending[key].cancel();
            delete this._pending[key];
        }

        return this._store.dispatch(ActionTypes.MAYBE_LOST, { deviceId: info.name }).then(() => {
            return (this._pending[key] = promiseAfter(Config.lossBufferDelay).then(() => {
                log.info("lose service (final):", info.type, info.name);

                delete this._pending[key];

                // save the event in our history before we notify the rest of the application.
                return this._history
                    .onLostStation(info)
                    .then(() => this._store.dispatch(ActionTypes.PROBABLY_LOST, { deviceId: info.name }))
                    .then(() => {
                        delete this._stations[key];
                    });
            }));
        });
    }

    private makeKey(station) {
        return station.name;
    }
}
