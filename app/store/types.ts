import { decodeAndPrepare } from "../services/query-station";
import { GlobalState } from "./modules/global";

export interface HasLocation {
    readonly latitude: number | null;
    readonly longitude: number | null;
}

export class Location implements HasLocation {
    constructor(public readonly latitude: number, public readonly longitude) {}

    maximum(other: Location): Location {
        return new Location(
            other.latitude > this.latitude ? other.latitude : this.latitude,
            other.longitude > this.longitude ? other.longitude : this.longitude
        );
    }

    minimum(other: Location): Location {
        return new Location(
            other.latitude < this.latitude ? other.latitude : this.latitude,
            other.longitude < this.longitude ? other.longitude : this.longitude
        );
    }

    clone(): Location {
        return new Location(this.latitude, this.longitude);
    }
}

export class Sensor {
    constructor(
        public readonly id: number | null,
        public readonly name: string,
        public readonly unitOfMeasure: string,
        public readonly reading: number | null,
        public readonly trend: number | null
    ) {}
}

export class Module {
    constructor(
        public readonly id: number | null,
        public readonly name: string,
        public readonly position: number,
        public readonly moduleId: string,
        public readonly sensors: Sensor[]
    ) {}
}

export interface StationCreationFields {
    id: number | null;
    deviceId: string;
    generationId: string;
    name: string;
    batteryLevel: number | null;
    consumedMemory: number | null;
    totalMemory: number | null;
    interval: number | null; // TODO rename
    longitude: number | null;
    latitude: number | null;
    deployStartTime: Date | null;
    serializedStatus: string;
    lastSeen: Date;
    portalId: number | null;
    portalError: string | null;
}

export class Station implements StationCreationFields {
    public readonly id: number | null;
    public readonly deviceId: string;
    public readonly generationId: string;
    public readonly name: string;
    public readonly batteryLevel: number | null;
    public readonly consumedMemory: number | null;
    public readonly totalMemory: number | null;
    public readonly interval: number | null;
    public readonly longitude: number | null;
    public readonly latitude: number | null;
    public readonly deployStartTime: Date | null;
    public readonly serializedStatus: string;
    public readonly lastSeen: Date;
    public readonly portalId: number | null;
    public readonly portalError: string | null;
    public readonly modules: Module[] = [];

    constructor(o: StationCreationFields, modules: Module[] = []) {
        this.id = o.id;
        this.deviceId = o.deviceId;
        this.generationId = o.generationId;
        this.name = o.name;
        this.batteryLevel = o.batteryLevel;
        this.consumedMemory = o.consumedMemory;
        this.totalMemory = o.totalMemory;
        this.interval = o.interval;
        this.latitude = o.latitude;
        this.longitude = o.longitude;
        this.deployStartTime = o.deployStartTime;
        this.serializedStatus = o.serializedStatus;
        this.lastSeen = o.lastSeen;
        this.portalId = o.portalId;
        this.portalError = o.portalError;
        this.modules = modules;
    }

    public location(): Location | null {
        if (this.latitude && this.longitude) {
            return new Location(this.latitude, this.longitude);
        }
        return null;
    }
}

export class LegacyStation extends Station {
    private decodedStatus: object | null = null;

    id: number;
    connected: boolean;
    url: string | null;

    constructor(fields: StationCreationFields, modules: Module[], available: AvailableStation) {
        super(fields, modules);
        if (!available.id) throw new Error(`AvailableStation missing id`);
        this.id = available.id;
        this.connected = available.connected;
        this.url = available.url;
    }

    statusJson(): any {
        if (this.decodedStatus == null) {
            this.decodedStatus = decodeAndPrepare(Buffer.from(this.serializedStatus, "base64"));
        }
        return this.decodedStatus;
    }
}

export interface ServiceInfo {
    readonly deviceId: string;
    readonly url: string;
}

export class NearbyStation {
    url: string;
    queried: Date;
    tried: Date | null;

    constructor(public readonly info: ServiceInfo) {
        this.url = info.url;
        this.queried = new Date();
        this.tried = null;
    }
}

export enum StationStatus {
    Unknown,
    Ready,
    Recording,
}

function isConnected(now: Date, nearby: NearbyStation | null): boolean {
    if (!nearby || !nearby.tried) {
        return false;
    }
    const elapsed = Math.abs(now.getTime() - nearby.tried.getTime());
    return elapsed < 60 * 1000;
}

export class AvailableStation {
    readonly id: number | null;
    readonly deviceId: string;
    readonly connected: boolean;
    readonly status: StationStatus;
    readonly name: string | null;
    readonly deployStartTime: Date | null;
    readonly location: Location | null;
    readonly url: string | null;

    constructor(now: Date, deviceId: string, nearby: NearbyStation | null, station: Station | null) {
        if (!nearby && !station) {
            throw new Error(`AvailableStation invalid args`);
        }
        this.deviceId = deviceId;
        this.status = StationStatus.Unknown;
        this.id = station?.id || null;
        this.name = station?.name || null;
        this.deployStartTime = station?.deployStartTime || null;
        this.url = nearby?.url || null;
        this.location = station?.location() || null;
        this.connected = isConnected(now, nearby);
    }
}

interface GlobalGetters {
    legacyStations: { [index: number]: LegacyStation };
}

export interface Store {
    commit(type: string, mutation: any): void;
    dispatch(type: string, action: any): Promise<any>;
    readonly state: GlobalState;
    readonly getters: GlobalGetters;
}

export class PhoneLocation {
    constructor(public readonly latitude: number, public readonly longitude: number, public readonly time: number) {}

    public location(): Location {
        return new Location(this.latitude, this.longitude);
    }

    clone(): PhoneLocation {
        return new PhoneLocation(this.latitude, this.longitude, this.time);
    }
}

export class CommonLocations {
    static TwinPeaksEastLosAngelesNationalForest: PhoneLocation = new PhoneLocation(34.3318104, -118.0730372, 0);
    static ConservifyLab: PhoneLocation = new PhoneLocation(34.029137, -118.2652074, 0);
    static ConservifyBlueLine: PhoneLocation = new PhoneLocation(34.0316369, -118.2684833, 0);
    static DowntownLA: PhoneLocation = new PhoneLocation(34.0479489, -118.2515045, 0);
    static VermontAndWilshire: PhoneLocation = new PhoneLocation(34.0680158, -118.291605, 0);
}

export class PhoneNetwork {
    constructor(public readonly ssid: string | null = null) {}
}
