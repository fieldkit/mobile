export interface HasLocation {
    readonly latitude: number | null;
    readonly longitude: number | null;
}

export class Sensor {
    constructor(
        public readonly id: number | null,
        public readonly name: string,
        public readonly unitOfMeasure: string,
        public readonly value: number | null
    ) {}
}

export class Module {
    constructor(
        public readonly id: number | null,
        public readonly name: string,
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
    longitude: number | null;
    latitude: number | null;
    deployStartTime: Date | null;
    serializedStatus: string;
}

export class Station implements StationCreationFields {
    public readonly id: number | null;
    public readonly deviceId: string;
    public readonly generationId: string;
    public readonly name: string;
    public readonly batteryLevel: number | null;
    public readonly consumedMemory: number | null;
    public readonly totalMemory: number | null;
    public readonly longitude: number | null;
    public readonly latitude: number | null;
    public readonly deployStartTime: Date | null;
    public readonly serializedStatus: string;
    public readonly modules: Module[] = [];

    constructor(o: StationCreationFields, modules: Module[] = []) {
        this.id = o.id;
        this.deviceId = o.deviceId;
        this.generationId = o.generationId;
        this.name = o.name;
        this.batteryLevel = o.batteryLevel;
        this.consumedMemory = o.consumedMemory;
        this.totalMemory = o.totalMemory;
        this.latitude = o.latitude;
        this.longitude = o.longitude;
        this.deployStartTime = o.deployStartTime;
        this.serializedStatus = o.serializedStatus;
        this.modules = modules;
    }

    public location(): Location | null {
        if (this.latitude && this.longitude) {
            return new Location(this.latitude, this.longitude);
        }
        return null;
    }
}

export interface StationsState {
    db: () => any;
    error: string | boolean;
    all: Station[];
}

export interface ServiceInfo {
    readonly deviceId: string;
    readonly url: string;
}

export class NearbyStation {
    queried: Date;
    tried: Date | null;

    constructor(public readonly info: ServiceInfo) {
        this.queried = new Date();
        this.tried = null;
    }
}

export interface NearbyState {
    queryStation: () => any | never;
    stations: { [index: string]: NearbyStation };
}

export interface GlobalState {
    readonly nearby: NearbyState;
    readonly stations: StationsState;
}

export enum StationStatus {
    Unknown,
    Ready,
    Recording,
}

export class Location implements HasLocation {
    constructor(public readonly latitude: number, public readonly longitude) {}
}

function isConnected(now: Date, nearby: NearbyStation | null): boolean {
    if (!nearby || !nearby.tried) {
        return false;
    }
    const elapsed = Math.abs(now.getTime() - nearby.tried.getTime());
    return elapsed < 60 * 1000;
}

export class AvailableStation {
    readonly deviceId: string;
    readonly connected: boolean;
    readonly status: StationStatus;
    readonly name: string | null;
    readonly location: Location | null;

    constructor(now: Date, deviceId: string, nearby: NearbyStation | null, station: Station | null) {
        if (!nearby && !station) {
            throw new Error(`AvailableStation invalid args`);
        }
        this.deviceId = deviceId;
        this.connected = isConnected(now, nearby);
        this.status = StationStatus.Unknown;
        this.name = station ? station.name : null;
        this.location = station ? station.location() : null;
    }
}
