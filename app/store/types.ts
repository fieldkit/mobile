import { decodeAndPrepare } from "../services/query-station";
import { GlobalState } from "./modules/global";
import { HttpStatusReply, ReplyStream } from "./http_reply";
import { StreamTableRow, DownloadTableRow } from "./row-types";
import { Location } from "./map-types";

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

export enum FileType {
    Meta,
    Data,
    Unknown,
}

export class FileTypeUtils {
    public static toString(ft: FileType) {
        return FileType[ft].toLowerCase();
    }

    public static fromString(s: string) {
        if (/meta/.test(s)) {
            return FileType.Meta;
        }
        if (/data/.test(s)) {
            return FileType.Data;
        }
        return FileType.Unknown;
    }
}

export class Download {
    constructor(
        public id: number,
        public deviceId: string,
        public generationId: string,
        public fileType: FileType,
        public size: number,
        public path: string,
        public time: Date,
        public firstBlock: number,
        public lastBlock: number,
        public uploaded: Date | null
    ) {}

    static fromRow(d: DownloadTableRow): Download {
        const fileType = FileTypeUtils.fromString(d.type);
        return new Download(
            d.id,
            d.deviceId,
            d.generation,
            fileType,
            d.size,
            d.path,
            new Date(d.timestamp),
            d.firstBlock,
            d.lastBlock,
            d.uploaded ? new Date(d.uploaded) : null
        );
    }
}

export class Stream {
    id: number | null = null;
    stationId: number | null = null;
    // deviceId: string;
    // type: string;
    // deviceSize: number;
    // deviceFirstBlock: number;
    // deviceLastBlock: number;
    downloadSize: number | null = null;
    downloadFirstBlock: number | null = null;
    downloadLastBlock: number | null = null;
    portalSize: number | null = null;
    portalFirstBlock: number | null = null;
    portalLastBlock: number | null = null;
    updated: Date = new Date();

    constructor(
        public deviceId: string,
        public type: string,
        public deviceSize: number,
        public deviceFirstBlock: number,
        public deviceLastBlock: number
    ) {}

    static fromRow(o: StreamTableRow): Stream {
        const s = new Stream(o.deviceId, o.type, o.deviceSize, o.deviceFirstBlock, o.deviceLastBlock);
        s.id = o.id;
        s.stationId = o.stationId;
        s.downloadSize = o.downloadSize;
        s.downloadFirstBlock = o.downloadFirstBlock;
        s.downloadLastBlock = o.downloadLastBlock;
        s.portalSize = o.portalSize;
        s.portalFirstBlock = o.portalFirstBlock;
        s.portalLastBlock = o.portalLastBlock;
        s.updated = new Date(o.updated);
        return s;
    }

    static fromReply(reply: HttpStatusReply, o: ReplyStream): Stream {
        const s = new Stream(reply.status.identity.deviceId, o.name.replace(".fkpb", ""), o.size, 0, o.block);
        s.id = null;
        s.stationId = null;
        s.downloadSize = null;
        s.downloadFirstBlock = null;
        s.downloadLastBlock = null;
        s.portalSize = null;
        s.portalFirstBlock = null;
        s.portalLastBlock = null;
        s.updated = new Date();
        return s;
    }

    fileType(): FileType {
        return FileTypeUtils.fromString(this.type);
    }

    keepingFrom(o: Stream | null) {
        if (!o) {
            return this;
        }
        this.id = o.id;
        this.stationId = o.stationId;
        this.downloadSize = o.downloadSize;
        this.downloadFirstBlock = o.downloadFirstBlock;
        this.downloadLastBlock = o.downloadLastBlock;
        this.portalSize = o.portalSize;
        this.portalFirstBlock = o.portalFirstBlock;
        this.portalLastBlock = o.portalLastBlock;
        return this;
    }
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
    public readonly streams: Stream[] = [];
    public readonly downloads: Download[] = [];

    constructor(o: StationCreationFields, modules: Module[] = [], streams: Stream[] = [], downloads: Download[] = []) {
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
        this.streams = streams;
        this.downloads = downloads;
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
            if (this.serializedStatus !== null && this.serializedStatus.length > 0) {
                try {
                    this.decodedStatus = decodeAndPrepare(Buffer.from(this.serializedStatus, "base64"));
                } catch (error) {
                    console.log("error decoding status json:", error, error ? error.stack : null);
                    console.log("error", this.serializedStatus);
                }
            }
        }
        return this.decodedStatus;
    }

    get deployed(): boolean {
        return this.deployStartTime != null;
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
