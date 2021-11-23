import { Conservify, Services, OurStore } from "@/services";
import { StartOptions, StopOptions } from "@/wrappers/networking";
import { Connectivity } from "@/wrappers/connectivity";
import { ActionTypes, RefreshNetworkAction, LostReasons } from "@/store";
import { FoundService, LostService, UdpMessage } from "@/services";
import { fk_app } from "fk-app-protocol/fk-app";
import { debug, promiseAfter, zoned, logAnalytics } from "@/lib";
import { Buffer } from "buffer";
import Config from "@/config";

const log = Config.logger("DiscoverStation");

interface DecodedUdpMessage {
    readonly address: string;
    readonly deviceId: string;
    readonly status: fk_app.UdpStatus;
}

class DiscoveredStation {
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
    private readonly FixedAddresses: { address: string; port: number }[] = [
        { address: "192.168.2.1", port: 80 },
        ...Config.defaultStations,
    ];
    private readonly store: OurStore;
    private enabled = false;

    constructor(private readonly services: Services) {
        this.store = services.Store();
        debug.log("network-monitor: ctor");
    }

    public async start(): Promise<void> {
        if (this.enabled) {
            return Promise.resolve();
        }

        this.enabled = true;

        debug.log("network-monitor: starting", this.enabled);

        Connectivity.startMonitoring((newType) => async () => {
            await zoned({}, async () => {
                try {
                    debug.log("network-monitor: connectivity", Connectivity.typeToString(newType));

                    switch (newType) {
                        case Connectivity.connectionType.wifi:
                            this.handleWifiChange();
                            break;
                        default:
                            break;
                    }
                    await this.issue();
                } catch (e) {
                    log.error("network-monitor", e);
                }
            });
        });

        void this.watch();

        return Promise.resolve();
    }

    private async watch(): Promise<void> {
        await promiseAfter(10000).then(() => zoned({ force: true }, () => this.issue()).finally(() => void this.watch()));
    }

    private async issue(): Promise<void> {
        await this.store.dispatch(new RefreshNetworkAction());
    }

    private handleWifiChange() {
        void promiseAfter(1000).then(() => this.tryFixedAddresses());
    }

    public async tryFixedAddresses(): Promise<void> {
        await Promise.all(
            this.FixedAddresses.map((fa) =>
                this.services
                    .QueryStation()
                    .getStatus(`http://${fa.address}:${fa.port}/fk/v1`)
                    .then(
                        (status) => {
                            return this.services.DiscoverStation().onFoundService({
                                type: "_fk._tcp",
                                name: status.status.identity.deviceId,
                                host: fa.address,
                                port: fa.port,
                            });
                        },
                        () => {
                            // ignore error
                        }
                    )
            )
        );
    }
}

export default class DiscoverStation {
    private readonly networkMonitor: NetworkMonitor;
    private readonly store: OurStore;
    private readonly conservify: Conservify;
    public monitoring = false;

    constructor(services: Services) {
        this.store = services.Store();
        this.conservify = services.Conservify();
        this.networkMonitor = new NetworkMonitor(services);

        services.DiscoveryEvents().add(this);
    }

    public started(): boolean {
        return this.monitoring;
    }

    public async restart(): Promise<void> {
        await logAnalytics("discovery_restart");

        return this.stopServiceDiscovery({ suspending: false }).then(() => promiseAfter(500).then(() => this.startServiceDiscovery()));
    }

    public async startMonitorinNetwork(): Promise<void> {
        await this.networkMonitor.start();
    }

    public async stopMonitorinNetwork(): Promise<void> {
        // noop
    }

    public async startServiceDiscovery(): Promise<void> {
        const options: StartOptions = {
            serviceTypeSearch: "_fk._tcp",
            serviceNameSelf: null,
            serviceTypeSelf: null,
        };

        await logAnalytics("discovery_start");

        // options.serviceNameSelf = Device.uuid;
        // options.serviceTypeSelf = "_fk._tcp";

        await this.conservify.start(options);

        this.monitoring = true;

        void this.networkMonitor.tryFixedAddresses();
    }

    public async stopServiceDiscovery(options: StopOptions | null): Promise<void> {
        await logAnalytics("discovery_stop");

        await this.conservify.stop(options || { suspending: true });

        this.monitoring = false;
    }

    public async onFoundService(info: FoundService): Promise<void> {
        const key = this.makeKey(info);
        const station = new DiscoveredStation(info);

        if (info.port != 80 && info.port < 2380 && info.port > 2400) {
            // Fake device uses 2380
            log.info("ignoring service:", info.type, info.name, info.host, info.port, key);
            return;
        }

        log.info("found service:", info.type, info.name, info.host, info.port, key);

        await logAnalytics("discovery_found");

        void this.store.dispatch(ActionTypes.FOUND, { url: station.url, deviceId: station.deviceId });

        return;
    }

    public async onLostService(info: LostService): Promise<void> {
        log.info("lose service (pending):", info.type, info.name, Config.lossBufferDelay);

        await logAnalytics("discovery_lost");

        void this.store.dispatch(ActionTypes.MAYBE_LOST, { deviceId: info.name, reason: LostReasons.LostService });

        return;
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

    public async onUdpMessage(message: UdpMessage): Promise<void> {
        try {
            const decoded = this.decodeUdpMessage(message);

            log.info("udp-decoded:", JSON.stringify(decoded));

            await logAnalytics("discovery_udp");

            const found: FoundService = {
                name: decoded.deviceId,
                host: decoded.address,
                type: "_fk._tcp",
                port: 80,
            };

            const station = new DiscoveredStation(found);

            switch (decoded.status) {
                case fk_app.UdpStatus.UDP_STATUS_ONLINE: {
                    void this.store.dispatch(ActionTypes.FOUND, { url: station.url, deviceId: station.deviceId });
                    break;
                }
                case fk_app.UdpStatus.UDP_STATUS_BYE: {
                    void this.store.dispatch(ActionTypes.LOST, {
                        url: station.url,
                        deviceId: station.deviceId,
                        reason: LostReasons.UdpBye,
                    });
                    break;
                }
            }
        } catch (e) {
            log.error(`error handling udp: ${JSON.stringify(message)}`, e);
        }
        return Promise.resolve();
    }

    private makeKey(station: { name: string }): string {
        return station.name;
    }
}
