export interface HasLocation {
    readonly latitude: number | null;
    readonly longitude: number | null;
}

export class Station {
    public readonly deviceId: string;
    public readonly generationId: string;
    public readonly name: string;
    public readonly batteryLevel: number | null;
    public readonly consumedMemory: number | null;
    public readonly totalMemory: number | null;
    public readonly longitude: number | null;
    public readonly latitude: number | null;

    constructor(o: any) {
        this.deviceId = o.deviceId;
        this.generationId = o.generationId;
        this.name = o.name;
        this.batteryLevel = o.batteryLevel;
        this.consumedMemory = o.consumedMemory;
        this.totalMemory = o.totalMemory;
        this.latitude = o.latitude;
        this.longitude = o.longitude;
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
    tried: Date;
    queried: Date | null;

    constructor(public readonly info: ServiceInfo) {
        this.tried = new Date();
        this.queried = null;
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

function isConnected(nearby: NearbyStation | null): boolean {
    if (!nearby || !nearby.queried) {
        return false;
    }
    const now = new Date();
    const lastQueried = Math.abs(now.getTime() - nearby.queried.getTime());
    return lastQueried < 60;
}

export enum StationStatus {
    Unknown,
    Ready,
    Recording,
}

export class Location implements HasLocation {
    constructor(public readonly latitude: number, public readonly longitude) {}
}

export class AvailableStation {
    readonly deviceId: string;
    readonly connected: boolean;
    readonly status: StationStatus;
    readonly name: string | null;
    readonly location: Location | null;

    constructor(deviceId: string, nearby: NearbyStation | null, station: Station | null) {
        if (!nearby && !station) {
            throw new Error(`AvailableStation invalid args`);
        }
        this.deviceId = deviceId;
        this.connected = isConnected(nearby);
        this.status = StationStatus.Unknown;
        this.name = station ? station.name : null;
        this.location = station ? station.location() : null;
    }
}
