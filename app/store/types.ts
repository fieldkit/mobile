export interface HasLocation {
    readonly latitude: number | null;
    readonly longitude: number | null;
}

export interface Station {
    readonly deviceId: string;
    readonly generationId: string;
    readonly name: string;
    readonly batteryLevel: number | null;
    readonly consumedMemory: number | null;
    readonly totalMemory: number | null;
    readonly longitude: number | null;
    readonly latitude: number | null;
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

export class AvailableStation {
    readonly deviceId: string;
    readonly name: string | null;
    readonly connected: boolean;

    constructor(deviceId: string, nearby: NearbyStation | null, station: Station | null) {
        if (!nearby && !station) {
            throw new Error(`AvailableStation invalid args`);
        }
        this.deviceId = deviceId;
        this.name = station != null ? station.name : null;
        this.connected = isConnected(nearby);
    }
}
