import { decodeAndPrepare } from "../services/query-station";
import { GlobalState } from "./modules/global";
import { HttpStatusReply, ReplyStream, AtlasStatus } from "./http_reply";
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
    public readonly internal: boolean;

    constructor(
        public readonly id: number | null,
        public readonly name: string,
        public readonly position: number,
        public readonly moduleId: string,
        public readonly flags: number,
        public readonly status: AtlasStatus | null,
        public readonly sensors: Sensor[]
    ) {
        this.internal = flags > 0;
    }
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
        public stationId: number,
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
            d.stationId,
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

    public get blocks(): string {
        return this.firstBlock + "," + this.lastBlock;
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
        console.log(
            "StreamRow",
            o.stationId,
            [o.deviceFirstBlock, o.deviceLastBlock],
            [o.downloadFirstBlock, o.downloadLastBlock],
            [o.portalFirstBlock, o.portalLastBlock]
        );
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
    portalHttpError: object | null;
}

export class FirmwareInfo {
    constructor(
        public readonly version: string,
        public readonly build: string,
        public readonly simpleNumber: number,
        public readonly time: number,
        public readonly hash: string
    ) {}
}

export interface StationPortalStatus {
    id: number;
    portalId: number | null;
    error: object | null;
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
    private _portalId: number | null;
    private _portalHttpError: object | null;
    public readonly modules: Module[] = [];
    public readonly streams: Stream[] = [];
    public readonly downloads: Download[] = [];

    public get portalId(): number | null {
        return this._portalId;
    }

    public get portalHttpError(): object | null {
        return this._portalHttpError;
    }

    public updatePortalStatus(status: StationPortalStatus) {
        if (status.portalId) {
            this._portalId = status.portalId;
        }
        this._portalHttpError = status.error;
    }

    constructor(o: StationCreationFields, modules: Module[] = [], streams: Stream[] = [], downloads: Download[] = []) {
        if (!o.id) {
            // throw new Error("station id is required");
        }
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
        this._portalId = o.portalId;
        this._portalHttpError = o.portalHttpError;
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

    public locationString(): string | null {
        const coordinates = this.location();
        if (coordinates == null) {
            return null;
        }
        return [coordinates.latitude, coordinates.longitude].map((v) => v.toFixed(2)).join(", ");
    }

    private decodedStatus: object | null = null;

    protected decodeStatusReply(): any {
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

    public firmwareInfo(): FirmwareInfo | null {
        const statusReply = this.decodeStatusReply();
        const fw = statusReply?.status?.firmware || null;
        if (!fw) {
            console.log("malformed status reply", statusReply);
            return null;
        }
        return new FirmwareInfo(fw.version, fw.build, fw.number, fw.timestamp, fw.hash);
    }
}

export class LegacyStation extends Station {
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

    public get deployed(): boolean {
        return this.deployStartTime != null;
    }

    public statusJson(): any {
        return this.decodeStatusReply();
    }
}

export interface SortableStation {
    readonly lastSeen: Date | null;
}

export const SortableStationSorter = (station: SortableStation): number => {
    if (!station.lastSeen) {
        return 0;
    }
    const FiveMinutesSecs = 300;
    const seen = station.lastSeen.getTime() / 1000;
    const rounded = Math.floor(seen / FiveMinutesSecs) * FiveMinutesSecs;
    return -rounded;
};

export interface ServiceInfo {
    readonly deviceId: string;
    readonly url: string;
}

export class NearbyStation {
    url: string;
    queried: Date = new Date();
    activity: Date = new Date();
    transferring = false;
    failures = 0;

    constructor(public readonly info: ServiceInfo) {
        this.url = info.url;
    }

    public old(now: Date): boolean {
        // We update activity during transfers so this should be unnecessary.
        /*
        if (this.transferring) {
            return false;
        }
		*/
        const elapsed = Math.abs(now.getTime() - this.activity.getTime());
        return elapsed > 60 * 1000;
    }

    public success(): NearbyStation {
        this.failures = 0;
        return this;
    }

    public failure(): NearbyStation {
        this.failures++;
        return this;
    }

    public tooManyFailures(): boolean {
        return this.failures >= 2;
    }
}

export enum StationStatus {
    Unknown,
    Ready,
    Recording,
}

export class AvailableStation {
    readonly id: number | null;
    readonly deviceId: string;
    readonly connected: boolean;
    readonly url: string | null;
    readonly streams: Stream[] = [];
    readonly downloads: Download[] = [];

    readonly name: string | null;
    readonly generationId: string | null;
    readonly deployStartTime: Date | null;
    readonly location: Location | null;
    readonly lastSeen: Date | null;

    constructor(deviceId: string, nearby: NearbyStation | null, station: Station | null) {
        if (!nearby && !station) {
            throw new Error(`AvailableStation invalid args`);
        }
        this.deviceId = deviceId;
        this.generationId = station?.generationId || null;
        this.id = station?.id || null;
        this.name = station?.name || null;
        this.deployStartTime = station?.deployStartTime || null;
        this.url = nearby?.url || null;
        this.lastSeen = station?.lastSeen || null;
        this.location = station?.location() || null;
        this.streams = station?.streams || [];
        this.downloads = station?.downloads || [];
        this.connected = nearby != null;
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

export class OpenProgressPayload {
    constructor(public readonly deviceId: string, public readonly downloading: boolean, public readonly totalBytes: number) {}
}

export class TransferProgress {
    constructor(
        public readonly deviceId: string,
        public readonly path: string,
        public readonly total: number,
        public readonly copied: number
    ) {}
}
