import { decodeAndPrepare, HttpStatusReply, ReplyStream, AtlasStatus, NetworkInfo } from "./http-types";
import { StreamTableRow, DownloadTableRow } from "./row-types";
import { Location } from "./map-types";

export * from "./http-types";
export * from "./row-types";
export * from "./map-types";

export class Sensor {
    constructor(
        public readonly id: number | null,
        public readonly name: string,
        public readonly unitOfMeasure: string,
        public readonly reading: number | null,
        public readonly trend: number | null
    ) {}
}

export type ModuleId = string;

export class Module {
    public readonly internal: boolean;
    public readonly image: string;

    constructor(
        public readonly id: number | null,
        public readonly stationId: number | null,
        public readonly name: string,
        public readonly position: number,
        public readonly moduleId: ModuleId,
        public readonly flags: number,
        public readonly status: AtlasStatus | null,
        public readonly sensors: Sensor[]
    ) {
        this.internal = flags > 0;
        this.image = this.getImage(name);
    }

    private getImage(name: string): string {
        const images: { [index: string]: string } = {
            "modules.distance": "~/images/Icon_Distance_Module.png",
            "modules.weather": "~/images/Icon_Weather_Module.png ",
            "modules.water.ec": "~/images/Icon_WaterConductivity_Module.png",
            "modules.water.ph": "~/images/Icon_WaterpH_Module.png",
            "modules.water.do": "~/images/Icon_DissolvedOxygen_Module.png",
            "modules.water.temp": "~/images/Icon_WaterTemp_Module.png",
            "modules.water.orp": "~/images/Icon_Water_Module.png",
            "modules.water.unknown": "~/images/Icon_Water_Module.png",
        };
        return images[name] || "~/images/Icon_Generic_Module.png";
    }
}

export enum FileType {
    Meta,
    Data,
    Unknown,
}

export class FileTypeUtils {
    public static toString(ft: FileType): string {
        return FileType[ft].toLowerCase();
    }

    public static fromString(s: string): FileType {
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
        return `${this.firstBlock},${this.lastBlock}`;
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
        public generationId: string | null,
        public type: string,
        public deviceSize: number,
        public deviceFirstBlock: number,
        public deviceLastBlock: number
    ) {}

    static fromRow(o: StreamTableRow): Stream {
        const s = new Stream(o.deviceId, o.generationId, o.type, o.deviceSize, o.deviceFirstBlock, o.deviceLastBlock);
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
        const identity = reply.status.identity;
        const s = new Stream(identity.deviceId, identity.generationId, o.name.replace(".fkpb", ""), o.size, 0, o.block);
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

    public fileType(): FileType {
        return FileTypeUtils.fromString(this.type);
    }

    public keepingFrom(o: StreamTableRow | null): Stream {
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

export interface IntervalLike {
    readonly start: number;
    readonly end: number;
    readonly interval: number;
}

export class Interval implements IntervalLike {
    constructor(public readonly start: number, public readonly end: number, public readonly interval: number) {}
}

export class Schedule {
    constructor(public intervals: IntervalLike[] = []) {}

    public static getMinimum(s: Schedule): Schedule {
        if (!s.intervals || s.intervals.length == 0) {
            return new Schedule([{ start: 0, end: 86400, interval: 60 }]);
        }
        return s;
    }
}

export interface PortalEnv {
    name: string | null;
    baseUri: string;
    ingestionUri: string;
}

export interface Schedules {
    readings: Schedule;
    network: Schedule;
}

export interface LoraSettings {
    appEui: Uint8Array;
    appKey: Uint8Array;
}

export type PortalError = Record<string, unknown>;

export interface StationCreationFields {
    id: number | null;
    deviceId: string;
    generationId: string;
    name: string;
    archived: boolean;
    batteryLevel: number | null;
    consumedMemory: number | null;
    totalMemory: number | null;
    schedules: Schedules;
    longitude: number | null;
    latitude: number | null;
    deployStartTime: Date | null;
    serializedStatus: string;
    lastSeen: Date;
    portalId: number | null;
    portalHttpError: PortalError | null;
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
    error: PortalError | null;
}

export class Station implements StationCreationFields {
    public readonly id: number | null;
    public readonly deviceId: string;
    public readonly generationId: string;
    public readonly name: string;
    public readonly archived: boolean;
    public readonly batteryLevel: number | null;
    public readonly consumedMemory: number | null;
    public readonly totalMemory: number | null;
    public readonly schedules: Schedules;
    public readonly longitude: number | null;
    public readonly latitude: number | null;
    public readonly deployStartTime: Date | null;
    public readonly serializedStatus: string;
    public readonly lastSeen: Date;
    private _portalId: number | null;
    private _portalHttpError: PortalError | null;
    public readonly modules: Module[] = [];
    public readonly streams: Stream[] = [];
    public readonly downloads: Download[] = [];
    public readonly connected?: boolean;

    public get portalId(): number | null {
        return this._portalId;
    }

    public get portalHttpError(): PortalError | null {
        return this._portalHttpError;
    }

    public updatePortalStatus(status: StationPortalStatus): void {
        if (status.portalId) {
            this._portalId = status.portalId;
        }
        this._portalHttpError = status.error;
    }

    constructor(o: StationCreationFields, modules: Module[] = [], streams: Stream[] = [], downloads: Download[] = []) {
        // if (!o.id) throw new Error(`station id is required`);
        this.id = o.id;
        this.deviceId = o.deviceId;
        this.generationId = o.generationId;
        this.name = o.name;
        this.archived = o.archived;
        this.batteryLevel = o.batteryLevel;
        this.consumedMemory = o.consumedMemory;
        this.totalMemory = o.totalMemory;
        this.schedules = o.schedules;
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

    private decodedStatus: HttpStatusReply | null = null;

    protected decodeStatusReply(): HttpStatusReply {
        if (this.decodedStatus == null) {
            if (this.serializedStatus !== null && this.serializedStatus.length > 0) {
                try {
                    this.decodedStatus = decodeAndPrepare(Buffer.from(this.serializedStatus, "base64"), this.serializedStatus);
                } catch (error: unknown) {
                    console.log(`${this.id || "<null>"} ${this.name} error decoding status json:`, error);
                    console.log(`${this.id || "<null>"} ${this.name} error serialized:`, this.serializedStatus);
                }
            }
        }
        if (!this.decodedStatus) throw new Error(`no decoded status for ${this.id || "<null>"} ${this.name}`);
        return this.decodedStatus;
    }

    public shouldArchive(): boolean {
        try {
            this.decodeStatusReply();
            return false;
        } catch (error: unknown) {
            console.log(`archiving station:`, error);
            return true;
        }
    }

    public get networks(): NetworkInfo[] {
        return this.decodedStatus?.networkSettings?.networks || [];
    }

    public firmwareInfo(): FirmwareInfo | null {
        try {
            const statusReply: HttpStatusReply = this.decodeStatusReply();
            const fw = statusReply?.status?.firmware || null;
            if (!fw) {
                console.log(`${this.id || "<null>"} ${this.name} malformed status reply, no firmware`, statusReply);
                return null;
            }
            return new FirmwareInfo(fw.version, fw.build, Number(fw.number), fw.timestamp, fw.hash);
        } catch (error: unknown) {
            console.log(`no firmwareInfo`, error);
            return null;
        }
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

    public statusJson(): HttpStatusReply {
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
    delay = 10000;
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
        this.delay = 10000;
        return this;
    }

    public failure(): NearbyStation {
        this.failures++;
        this.delay = 200;
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
    constructor(public readonly ssid: string | null, public readonly wifi: boolean = false) {}
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
