import Promise from "bluebird";
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
    private readonly store: any;

    constructor(private readonly services) {
        this.store = services.Store();

        Connectivity.startMonitoring((newType) => {
            try {
                log.info(newType);
            } catch (e) {
                console.log("NetworkMonitor error:", e);
            }
        });

        this.watch();
    }

    private watch() {
        return this.services
            .Conservify()
            .findConnectedNetwork()
            .then((status) => this.store.commit(MutationTypes.PHONE_NETWORK, status.connectedWifi))
            .finally(() => Promise.delay(1000).then(() => this.watch()));
    }

    protected tryFixedAddress() {
        const ip = "192.168.2.1";
        this.services
            .QueryStation()
            .getStatus("http://" + ip + "/fk/v1")
            .then(
                (status) => {
                    console.log("found device in ap mode", status.identity.deviceId, status.identity.device);
                    this.services.DiscoverStation().onFoundService({
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

    protected couldBeStation(ssid) {
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
    public readonly networkMonitor: NetworkMonitor;

    private readonly services: any;
    private readonly store: any;
    private readonly conservify: any;
    private readonly pending: { [index: string]: any };
    private readonly history: any;
    private stations: { [index: string]: Station } = {};
    private monitoring = false;

    constructor(services) {
        this.services = services;
        this.store = services.Store();
        this.conservify = services.Conservify();
        this.history = new EventHistory(this.services.Database());
        this.pending = {};
        this.networkMonitor = new NetworkMonitor(this.services);

        services.DiscoveryEvents().add(this);
    }

    public started() {
        return this.monitoring;
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
        if (this.monitoring) {
            return Promise.resolve(true);
        }
        this.monitoring = true;
        this.watchFakePreconfiguredDiscoveries();
        return this.conservify.start("_fk._tcp");
    }

    public stopServiceDiscovery() {
        this.monitoring = false;
        this.stations = {};
        return Promise.resolve(this.conservify.stop());
    }

    protected onFoundService(info: FoundService): Promise<any> {
        const key = this.makeKey(info);
        const station = new Station(info);

        log.info("found service:", info.type, info.name, info.host, info.port, key);

        if (this.pending[key]) {
            log.info("cancel pending loss");
            this.pending[key].cancel();
            delete this.pending[key];
        }

        this.stations[key] = station;

        // save the event in our history before we notify the rest of the application.
        return this.history
            .onFoundStation(info)
            .then(() => this.store.dispatch(ActionTypes.FOUND, { url: station.url, deviceId: station.deviceId }));
    }

    protected onLostService(info: LostService): Promise<any> {
        const key = this.makeKey(info);

        if (!this.stations[key]) {
            log.info("lose service (pending, unknown):", info.type, info.name, Config.lossBufferDelay);
        } else {
            log.info("lose service (pending):", info.type, info.name, Config.lossBufferDelay);
        }

        if (this.pending[key]) {
            this.pending[key].cancel();
            delete this.pending[key];
        }

        return this.store.dispatch(ActionTypes.MAYBE_LOST, { deviceId: info.name }).then(() => {
            return (this.pending[key] = promiseAfter(Config.lossBufferDelay).then(() => {
                log.info("lose service (final):", info.type, info.name);

                delete this.pending[key];

                // save the event in our history before we notify the rest of the application.
                return this.history
                    .onLostStation(info)
                    .then(() => this.store.dispatch(ActionTypes.PROBABLY_LOST, { deviceId: info.name }))
                    .then(() => {
                        delete this.stations[key];
                    });
            }));
        });
    }

    private makeKey(station) {
        return station.name;
    }
}
