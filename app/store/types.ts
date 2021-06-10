import _ from "lodash";
import { debug } from "@/lib";
import { Buffer } from "buffer";
import { decodeAndPrepare, HttpStatusReply, ReplyStream, NetworkInfo, ModuleConfiguration } from "./http-types";
import { StreamTableRow, DownloadTableRow } from "./row-types";
import { Location } from "./map-types";

export * from "./http-types";
export * from "./row-types";
export * from "./map-types";

export class Sensor {
    constructor(
        public readonly id: number | null,
        public readonly name: string,
        public readonly position: number,
        public readonly unitOfMeasure: string,
        public readonly reading: number | null,
        public readonly uncalibrated: number | null,
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
        public readonly configuration: ModuleConfiguration | null,
        public readonly sensors: Sensor[]
    ) {
        this.internal = flags > 0;
        this.image = this.getImage(name);
        this.sensors = _.sortBy(this.sensors, (s) => s.position);
    }

    private getImage(name: string): string {
        const images: { [index: string]: string } = {
            "modules.distance": "~/images/Icon_Distance_Module.png",
            "modules.weather": "~/images/Icon_Weather_Module.png ",
            "modules.water.ec": "~/images/Icon_WaterConductivity_Module.png",
            "modules.water.ph": "~/images/Icon_WaterpH_Module.png",
            "modules.water.do": "~/images/Icon_DissolvedOxygen_Module.png",
            "modules.water.dox": "~/images/Icon_DissolvedOxygen_Module.png",
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

    public static asSimple(s: Schedule): Schedule {
        if (s.intervals.length > 1) {
            return new Schedule([s.intervals[0]]);
        }
        return s;
    }

    public static asComplex(s: Schedule): Schedule {
        return s;
    }

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

export const NoPortalError = null;

export interface StationPortalStatus {
    id: number;
    portalId: number | null;
    ownerId: number | null;
    error: PortalError | null;
}

export interface StationCreationFields {
    id: number | null;
    userId: number | null;
    deviceId: string;
    generationId: string;
    name: string;
    archived: boolean;
    forgetting: boolean;
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
        public readonly simpleNumber: number,
        public readonly time: number,
        public readonly hash: string
    ) {}
}

export class Station implements StationCreationFields {
    public readonly id: number | null;
    public readonly userId: number | null;
    public readonly deviceId: string;
    public readonly generationId: string;
    public readonly name: string;
    public readonly archived: boolean;
    public readonly forgetting: boolean;
    public readonly batteryLevel: number | null;
    public readonly consumedMemory: number | null;
    public readonly totalMemory: number | null;
    public readonly schedules: Schedules;
    public readonly longitude: number | null;
    public readonly latitude: number | null;
    public readonly deployStartTime: Date | null;
    public readonly serializedStatus: string;
    public readonly lastSeen: Date;
    public readonly modules: Module[] = [];
    public readonly streams: Stream[] = [];
    public readonly downloads: Download[] = [];

    constructor(o: StationCreationFields, modules: Module[] = [], streams: Stream[] = [], downloads: Download[] = []) {
        // if (!o.id) throw new Error(`station id is required`);
        this.id = o.id;
        this.userId = o.userId;
        this.deviceId = o.deviceId;
        this.generationId = o.generationId;
        this.name = o.name;
        this.archived = o.archived;
        this.forgetting = o.forgetting;
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

    private _portalId: number | null;
    private _portalHttpError: PortalError | null;

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

    public decodeStatusReply(): HttpStatusReply {
        if (this.decodedStatus == null) {
            if (this.serializedStatus !== null && this.serializedStatus.length > 0) {
                try {
                    this.decodedStatus = decodeAndPrepare(Buffer.from(this.serializedStatus, "base64"), this.serializedStatus);
                } catch (error: unknown) {
                    debug.log(`${this.id || "<null>"} ${this.name} error decoding status json:`, error);
                    debug.log(`${this.id || "<null>"} ${this.name} error serialized:`, this.serializedStatus);
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
            debug.log(`archiving station:`, error);
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
                debug.log(`${this.id || "<null>"} ${this.name} malformed status reply, no firmware`, statusReply);
                return null;
            }
            return new FirmwareInfo(fw.version, Number(fw.number), fw.timestamp, fw.hash);
        } catch (error: unknown) {
            debug.log(`no firmwareInfo`, error);
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

export class DiscoveringStation {
    constructor(public readonly deviceId: string, public readonly url: string) {}
}

export class AvailableStation {
    public readonly id: number;
    public readonly deviceId: string;
    public readonly connected: boolean;
    public readonly forgetting: boolean;
    public readonly url: string | null;
    public readonly streams: Stream[] = [];
    public readonly downloads: Download[] = [];
    public readonly name: string | null;
    public readonly generationId: string | null;
    public readonly deployStartTime: Date | null;
    public readonly location: Location | null;
    public readonly lastSeen: Date | null;
    public readonly networks: NetworkInfo[] = [];
    public readonly schedules: Schedules;
    public readonly lora: { deviceEui: string } | null = null;

    constructor(deviceId: string, nearby: NearbyStation | null, station: Station) {
        if (!station) throw new Error(`AvailableStation station required`);
        const id = station.id;
        if (!id) throw new Error(`AvailableStation id required`);

        this.id = id;
        this.deviceId = deviceId;
        this.generationId = station.generationId || null;
        this.name = station.name || null;
        this.deployStartTime = station.deployStartTime || null;
        this.lastSeen = station.lastSeen || null;
        this.location = station.location() || null;
        this.streams = station.streams || [];
        this.downloads = station.downloads || [];
        this.networks = station.networks;
        this.schedules = station.schedules;
        this.forgetting = station.forgetting;

        this.connected = nearby != null;
        this.url = nearby?.url || null;
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
    constructor(public readonly ssid: string | null, public readonly ap: boolean = false) {}
}

// TODO We have two types with this name.
export class TransferProgress {
    constructor(
        public readonly deviceId: string,
        public readonly path: string,
        public readonly total: number,
        public readonly copied: number
    ) {}
}

export class LocalFile {
    constructor(public readonly path: string, public readonly size: number) {}
}

export class PendingUpload {
    constructor(
        public readonly fileType: FileType,
        public readonly firstBlock: number,
        public readonly lastBlock: number,
        public readonly bytes: number,
        public readonly files: LocalFile[] = []
    ) {}

    get blocks(): number {
        return this.lastBlock - this.firstBlock;
    }
}

export class PendingDownload {
    constructor(
        public readonly fileType: FileType,
        public readonly url: string,
        public readonly path: string,
        public readonly firstBlock: number,
        public readonly lastBlock: number,
        public readonly bytes: number
    ) {}

    get blocks(): number {
        return this.lastBlock - this.firstBlock;
    }
}

export enum SyncState {
    DownloadReady,
    UploadReady,
    UploadReadyOffline,
    Downloaded,
    Copying,
    Complete,
}

export enum TransferError {
    None,
    Authentication,
    Other,
}

export class StationSyncStatus {
    public connecting = false;
    public disconnected = false;

    /**
     * A little convulated and can be replaced later, just wanna be
     * sure we're catching all the situations and seeing this broken down is
     * nice.
     */
    public get connected(): boolean {
        return (this.wasConnected || this.connecting) && !this.disconnected;
    }

    constructor(
        public readonly id: number,
        public readonly deviceId: string,
        public readonly generationId: string, // Used in resetting sync status.
        public readonly name: string,
        public readonly wasConnected: boolean,
        public readonly lastSeen: Date,
        public readonly time: Date,
        private readonly downloaded: number,
        private readonly uploaded: number,
        public readonly downloads: PendingDownload[] = [],
        public readonly uploads: PendingUpload[] = [],
        public readonly location: string | null = null,
        public readonly error: TransferError = TransferError.None,
        public readonly progress: StationProgress | null = null
    ) {}

    public withProgress(progress: StationProgress | null): StationSyncStatus {
        if (progress) {
            debug.log(`with-progress`, progress);
        }
        return new StationSyncStatus(
            this.id,
            this.deviceId,
            this.generationId,
            this.name,
            this.connected,
            this.lastSeen,
            this.time,
            this.downloaded,
            this.uploaded,
            this.downloads,
            this.uploads,
            this.location,
            this.error,
            progress
        );
    }

    public get isDownloading(): boolean {
        return this.progress ? this.progress.downloading : false;
    }

    public get isUploading(): boolean {
        return this.progress ? !this.progress.downloading : false;
    }

    // State

    public get state(): SyncState {
        if (this.isDownloading || this.isUploading) {
            return SyncState.Copying;
        }
        if (this.readingsIncoming > 0) {
            if (this.connected) {
                return SyncState.DownloadReady;
            }
        }
        if (this.readingsOutgoing > 0) {
            if (this.onAP) {
                return SyncState.Downloaded;
            }
            return SyncState.UploadReady;
        }
        return SyncState.Complete;
    }

    public get hasError(): boolean {
        return this.error !== TransferError.None;
    }

    public get isAuthenticationError(): boolean {
        return this.error === TransferError.Authentication;
    }

    public get isOtherError(): boolean {
        return this.error === TransferError.Other;
    }

    public get onAP(): boolean {
        return this.connected;
    }

    public get isCopying(): boolean {
        return this.state == SyncState.Copying;
    }

    public get isDownloadReady(): boolean {
        return this.state == SyncState.DownloadReady;
    }

    public get isDownloaded(): boolean {
        return this.state == SyncState.Downloaded;
    }

    public get isUploadReady(): boolean {
        return this.state == SyncState.UploadReady;
    }

    public get isComplete(): boolean {
        return this.state == SyncState.Complete;
    }

    // Number of readings

    public get readingsDownloaded(): number {
        return this.downloaded;
    }

    public get readingsUploaded(): number {
        return this.uploaded;
    }

    public get readingsIncoming(): number {
        return _.sum(this.downloads.filter((file) => file.fileType == FileType.Data).map((f) => f.blocks)) || 0;
    }

    public get readingsOutgoing(): number {
        return _.sum(this.uploads.filter((file) => file.fileType == FileType.Data).map((f) => f.blocks)) || 0;
    }

    public get readingsCopying(): number {
        if (this.isDownloading) {
            return this.readingsReadyDownload;
        }
        if (this.isUploading) {
            return this.readingsReadyUpload;
        }
        return 0;
    }

    public get readingsReadyUpload(): number {
        return _.sum(this.uploads.filter((file) => file.fileType == FileType.Data).map((f) => f.blocks)) || 0;
    }

    public get readingsReadyDownload(): number {
        return _.sum(this.downloads.filter((file) => file.fileType == FileType.Data).map((f) => f.blocks)) || 0;
    }

    public getPathsToUpload(): string[] {
        return _(this.uploads)
            .map((u) => u.files)
            .flatten()
            .map((f) => f.path)
            .value();
    }

    public makeRow(file: PendingDownload, headers: HttpHeaders): DownloadTableRow {
        delete headers["connection"];
        const { range, firstBlock, lastBlock } = parseBlocks(headers["fk-blocks"]);

        debug.log(`make-row: ${JSON.stringify(headers)} ${firstBlock} ${lastBlock}`);

        return {
            id: 0,
            stationId: this.id,
            deviceId: this.deviceId,
            generation: this.generationId,
            path: file.path,
            type: FileTypeUtils.toString(file.fileType),
            timestamp: this.time.getTime(),
            url: file.url,
            size: file.bytes,
            blocks: range,
            firstBlock: firstBlock,
            lastBlock: lastBlock,
            uploaded: null,
        };
    }
}

export type HttpHeaders = { [index: string]: string };

export class StationProgress {
    constructor(
        public readonly deviceId: string,
        public readonly downloading: boolean,
        public readonly totalBytes: number,
        private readonly transfers: { [index: string]: TransferProgress } = {}
    ) {}

    public include(progress: TransferProgress): StationProgress {
        return new StationProgress(this.deviceId, this.downloading, this.totalBytes, {
            ...this.transfers,
            ...{ [progress.path]: progress },
        });
    }

    private get copiedBytes(): number {
        return _.sum(Object.values(this.transfers).map((t) => t.copied));
    }

    public get decimal(): number {
        if (this.totalBytes > 0) {
            return this.copiedBytes / this.totalBytes;
        }

        const transfers = Object.values(this.transfers);
        const total = _.sum(transfers.map((i) => i.total));
        const copied = _.sum(transfers.map((i) => i.copied));
        if (total == 0) {
            return 0;
        }
        return copied / total;
    }

    public get percentage(): string {
        return (this.decimal * 100.0).toFixed(0) + "%";
    }
}

function parseBlocks(blocks: [string] | string) {
    if (Array.isArray(blocks)) {
        blocks = blocks[0];
    }

    if (!_.isString(blocks)) {
        throw new Error(`invalid fk-blocks header: ${JSON.stringify(blocks)}`);
    }

    const parts = blocks
        .split(",")
        .map((s) => s.trim())
        .map((s) => Number(s));
    if (parts.length != 2) {
        throw new Error(`invalid fk-blocks header: ${blocks}`);
    }

    return {
        range: parts.join(","),
        firstBlock: parts[0],
        lastBlock: parts[1],
    };
}
