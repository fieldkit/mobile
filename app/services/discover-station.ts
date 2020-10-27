import Bluebird from "bluebird";
import { Device } from "@nativescript/core";
import { Services, OurStore } from "@/services";
import { Connectivity } from "@/wrappers/connectivity";
import { promiseAfter } from "@/utilities";
import { ActionTypes, MutationTypes, PhoneNetwork, UdpMessage } from "@/store";
import { fk_app } from "fk-app-protocol/fk-app";
import Config from "@/config";

const log = Config.logger("DiscoverStation");

export interface DecodedUdpMessage {
    readonly address: string;
    readonly deviceId: string;
    readonly status: fk_app.UdpStatus;
}

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
        this.url = `${this.scheme}://${this.host}:${this.port}/fk/v1`;
    }

    public get found(): FoundService {
        return new FoundService(this.type, this.name, this.host, this.port);
    }
}

class NetworkMonitor {
    private readonly FixedAddresses: string[] = ["192.168.2.1"];
    private readonly store: OurStore;
    private enabled = false;
    private wifi = false;

    constructor(private readonly services: Services) {
        this.store = services.Store();
        console.log("network-monitor: ctor");
    }

    public start() {
        if (this.enabled) {
            return;
        }

        this.enabled = true;

        console.log("network-monitor: starting", this.enabled);

        Connectivity.startMonitoring((newType) => {
            try {
                console.log("network-monitor: connectivity", Connectivity.typeToString(newType));

                switch (newType) {
                    case Connectivity.connectionType.wifi:
                        this.wifi = true;
                        this.handleWifiChange();
                        break;
                    default:
                        this.wifi = false;
                        break;
                }
                void this.issue();
            } catch (e) {
                log.error("network-monitor", e);
            }
        });

        void this.watch();
    }

    private watch(): Promise<void> {
        return Bluebird.delay(10000).then(() => this.issue().finally(() => void this.watch()));
    }

    private issue(): Promise<void> {
        return this.services
            .Conservify()
            .findConnectedNetwork()
            .then((status) =>
                this.store.commit(MutationTypes.PHONE_NETWORK, new PhoneNetwork(status.connectedWifi?.ssid || null, this.wifi))
            );
    }

    private handleWifiChange() {
        void Bluebird.delay(1000).then(() => this.tryFixedAddresses());
    }

    private tryFixedAddresses(): Promise<void> {
        return Promise.all(
            this.FixedAddresses.map((ip: string) =>
                this.services
                    .QueryStation()
                    .getStatus("http://" + ip + "/fk/v1")
                    .then(
                        (status) => {
                            console.log("found device in ap mode", status.status.identity.deviceId, status.status.identity.device);
                            return this.services.DiscoverStation().onFoundService({
                                type: "_fk._tcp",
                                name: status.status.identity.deviceId,
                                host: ip,
                                port: 80,
                            });
                        },
                        () => {
                            console.log("no devices in ap mode");
                        }
                    )
            )
        ).then(() => {
            return;
        });
    }
}

export class FoundService {
    constructor(public readonly type: string, public readonly name: string, public readonly host: string, public readonly port: number) {}
}

export class LostService {
    constructor(public readonly type: string, public readonly name: string) {}
}

export default class DiscoverStation {
    protected readonly networkMonitor: NetworkMonitor;
    private readonly store: OurStore;
    private readonly conservify: any;
    private readonly pending: { [index: string]: any };
    private stations: { [index: string]: Station } = {};
    private monitoring = false;

    constructor(services) {
        this.store = services.Store();
        this.conservify = services.Conservify();
        this.pending = {};
        this.networkMonitor = new NetworkMonitor(services);

        services.DiscoveryEvents().add(this);
    }

    public started(): boolean {
        return this.monitoring;
    }

    public restart(): Promise<void> {
        return this.stopServiceDiscovery().then(() => Bluebird.delay(500).then(() => this.startServiceDiscovery()));
    }

    public startServiceDiscovery(): Promise<void> {
        this.networkMonitor.start();

        if (this.monitoring) {
            return Promise.resolve();
        }
        this.monitoring = true;
        return this.conservify.start("_fk._tcp", Device.uuid, "_fk._tcp");
    }

    public stopServiceDiscovery(): Promise<void> {
        this.monitoring = false;
        this.stations = {};
        return Promise.resolve(this.conservify.stop());
    }

    public onFoundService(info: FoundService): Promise<void> {
        const key = this.makeKey(info);
        const station = new Station(info);

        log.info("found service:", info.type, info.name, info.host, info.port, key);

        if (this.pending[key]) {
            log.info("cancel pending loss");
            this.pending[key].cancel();
            delete this.pending[key];
        }

        this.stations[key] = station;

        return this.store.dispatch(ActionTypes.FOUND, { url: station.url, deviceId: station.deviceId });
    }

    public onLostService(info: LostService): Promise<void> {
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

                return this.store.dispatch(ActionTypes.PROBABLY_LOST, { deviceId: info.name }).then(() => {
                    delete this.stations[key];
                });
            }));
        });
    }

    private decodeUdpMessage(message: UdpMessage): DecodedUdpMessage {
        const buffer = Buffer.from(message.data, "base64");
        const decoded = fk_app.UdpMessage.decodeDelimited(buffer);
        const deviceId = Buffer.from(decoded.deviceId).toString("hex");
        return {
            address: message.address,
            deviceId: deviceId,
            status: decoded.status || fk_app.UdpStatus.UDP_STATUS_ONLINE,
        };
    }

    public onUdpMessage(message: UdpMessage): Promise<void> {
        try {
            const decoded = this.decodeUdpMessage(message);
            log.info("udp-decoded:", decoded);

            const found: FoundService = {
                name: decoded.deviceId,
                host: decoded.address,
                type: "_fk._tcp",
                port: 80,
            };

            const key = this.makeKey(found);
            const station = new Station(found);

            switch (decoded.status) {
                case fk_app.UdpStatus.UDP_STATUS_ONLINE: {
                    if (this.stations[key]) {
                        return Promise.resolve();
                    }
                    this.stations[key] = station;
                    return this.store.dispatch(ActionTypes.FOUND, { url: station.url, deviceId: station.deviceId });
                }
                case fk_app.UdpStatus.UDP_STATUS_BYE: {
                    return this.store.dispatch(ActionTypes.LOST, { url: station.url, deviceId: station.deviceId }).then(() => {
                        delete this.stations[key];
                    });
                }
            }
        } catch (e) {
            log.error(`error handling udp: ${message} ${e}`);
        }
        return Promise.resolve();
    }

    private makeKey(station: { name: string }): string {
        return station.name;
    }
}
