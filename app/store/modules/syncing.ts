import _ from "lodash";
import Vue from "vue";
import { ActionContext } from "vuex";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import {
    Station,
    Download,
    FileType,
    FileTypeUtils,
    OpenProgressPayload,
    TransferProgress,
    ServiceInfo,
    SortableStationSorter,
} from "../types";
import { ServiceRef, CalculatedSize } from "@/services";
import { serializePromiseChain, getPathTimestamp, getFilePath, getFileName } from "../../utilities";
import { DownloadTableRow } from "../row-types";
import { AuthenticationError } from "../../lib/errors";

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
        private readonly generationId: string,
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

export const StationSyncsSorter = (syncs: StationSyncStatus[]): StationSyncStatus[] => {
    return _.orderBy(syncs, [(sync) => SortableStationSorter(sync)]);
};

export class SyncingState {
    syncs: StationSyncStatus[] = [];
    busy: { [index: string]: boolean } = {};
    progress: { [index: string]: StationProgress } = {};
    pending: { [index: string]: Download } = {};
    connected: { [index: string]: ServiceInfo } = {};
    stations: Station[] = [];
    errors: { [index: string]: TransferError } = {};
}

function querySizes(services: ServiceRef, downloads: PendingDownload[]): Promise<CalculatedSize[]> {
    return serializePromiseChain(downloads, (download: PendingDownload) => {
        console.log("size:", download.url);
        return services.queryStation().calculateDownloadSize(download.url);
    });
}

type ActionParameters = ActionContext<SyncingState, never>;

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.DOWNLOAD_ALL]: ({ dispatch }: ActionParameters, syncs: StationSyncStatus[]): Promise<any> => {
            return Promise.all(syncs.map((dl) => dispatch(ActionTypes.DOWNLOAD_STATION, dl)));
        },
        [ActionTypes.DOWNLOAD_STATION]: ({ commit, dispatch, state }: ActionParameters, sync: StationSyncStatus): Promise<any> => {
            if (!sync.connected) {
                throw new Error("refusing to download from disconnected station");
            }

            if (state.busy[sync.deviceId]) {
                throw new Error("refusing to download while already busy");
            }

            state.busy[sync.deviceId] = true;

            console.log("syncing:download", sync.downloads);

            return querySizes(services, sync.downloads)
                .then((sizes) => {
                    console.log("syncing:sizes", sizes);

                    const totalBytes = _.sum((sizes) => sizes.size);

                    commit(MutationTypes.TRANSFER_OPEN, new OpenProgressPayload(sync.deviceId, true, totalBytes));
                    return serializePromiseChain(sync.downloads, (file: PendingDownload) => {
                        const fsFolder = services.fs().getFolder(getFilePath(file.path));
                        const fsFile = fsFolder.getFile(getFileName(file.path));
                        console.log("syncing:download", file.url, fsFile);
                        return services
                            .queryStation()
                            .download(file.url, fsFile.path, (total: number, copied: number, info) => {
                                commit(MutationTypes.TRANSFER_PROGRESS, new TransferProgress(sync.deviceId, file.path, total, copied));
                            })
                            .then(({ headers }) => services.db().insertDownload(sync.makeRow(file, headers)))
                            .catch((error) => {
                                if (AuthenticationError.isInstance(error)) {
                                    Vue.set(state.errors, sync.deviceId, TransferError.Authentication);
                                } else {
                                    Vue.set(state.errors, sync.deviceId, TransferError.Other);
                                }
                                console.log("error downloading", error, error ? error.stack : null);
                                return Promise.reject(error);
                            });
                    });
                })
                .then(() => dispatch(ActionTypes.LOAD))
                .finally(() => {
                    commit(MutationTypes.TRANSFER_CLOSE, sync.deviceId);
                    state.busy[sync.deviceId] = false;
                });
        },
        [ActionTypes.UPLOAD_ALL]: ({ commit, dispatch, state }: ActionParameters, syncs: StationSyncStatus[]): Promise<any> => {
            return Promise.all(syncs.map((dl) => dispatch(ActionTypes.UPLOAD_STATION, dl)));
        },
        [ActionTypes.UPLOAD_STATION]: ({ commit, dispatch, state }: ActionParameters, sync: StationSyncStatus): Promise<any> => {
            const paths = sync.getPathsToUpload();
            const downloads = paths.map((path) => state.pending[path]).filter((d) => d != null);
            if (downloads.length != paths.length) {
                throw new Error("download missing");
            }

            if (state.busy[sync.deviceId]) {
                throw new Error("refusing to upload while already busy");
            }

            state.busy[sync.deviceId] = true;

            const totalBytes = _(downloads)
                .map((d) => d.size)
                .sum();

            console.log("syncing:upload", downloads);

            commit(MutationTypes.TRANSFER_OPEN, new OpenProgressPayload(sync.deviceId, false, totalBytes));

            return serializePromiseChain(downloads, (download: Download) => {
                console.log("syncing:upload", sync.name, download);
                return services
                    .portal()
                    .uploadPreviouslyDownloaded(sync.name, download, (total: number, copied: number, info) => {
                        commit(MutationTypes.TRANSFER_PROGRESS, new TransferProgress(sync.deviceId, download.path, total, copied));
                    })
                    .then(() => services.db().markDownloadAsUploaded(download))
                    .catch((error: Error) => {
                        if (AuthenticationError.isInstance(error)) {
                            console.log("error uploading (auth)", error, error ? error.stack : null);
                            Vue.set(state.errors, sync.deviceId, TransferError.Authentication);
                        } else {
                            console.log("error uploading (other)", error, error ? error.stack : null);
                            Vue.set(state.errors, sync.deviceId, TransferError.Other);
                        }
                        return Promise.reject(error);
                    });
            })
                .then(() => dispatch(ActionTypes.LOAD))
                .finally(() => {
                    commit(MutationTypes.TRANSFER_CLOSE, sync.deviceId);
                    state.busy[sync.deviceId] = false;
                });
        },
    };
};

const getters = {
    syncs: (state: SyncingState): StationSyncStatus[] => {
        return state.syncs.map((sync) => {
            return sync.withProgress(state.progress[sync.deviceId]);
        });
    },
};

function makeStationSyncs(state: SyncingState): StationSyncStatus[] {
    const now = new Date();
    const syncs = state.stations.map((station) => {
        if (!station.id || !station.generationId || !station.name || !station.lastSeen) {
            throw new Error("id, generationId, and name are required");
        }

        const connected = state.connected[station.deviceId] || null;
        const lastSeen = station.lastSeen;
        const baseUrl = connected ? connected.url : "https://www.fieldkit.org/off-line-bug";

        const downloads = station.streams
            .map((stream) => {
                const firstBlock = stream.downloadLastBlock || 0;
                const lastBlock = stream.deviceLastBlock;
                const estimatedBytes = stream.deviceSize - (stream.downloadSize || 0);
                const typeName = FileTypeUtils.toString(stream.fileType());
                const queryString = firstBlock > 0 ? `?first=${firstBlock}` : "";
                const url = baseUrl + "/download/" + typeName + queryString;
                const filePath = ["downloads", station.deviceId, getPathTimestamp(now), typeName + ".fkpb"].join("/");
                return new PendingDownload(stream.fileType(), url, filePath, firstBlock, lastBlock, estimatedBytes);
            })
            .filter((dl) => dl.firstBlock != dl.lastBlock)
            .filter((dl) => dl.fileType != FileType.Unknown)
            .sort((a, b) => {
                return a.fileType < b.fileType ? -1 : 1;
            });

        const uploads = station.streams
            .map((stream) => {
                const firstBlock = stream.portalLastBlock || 0;
                const lastBlock = stream.downloadLastBlock || 0;
                const estimatedBytes = (stream.downloadSize || 0) - (stream.portalSize || 0);
                const files = station.downloads
                    .filter((d) => d.fileType == stream.fileType())
                    .filter((d) => !d.uploaded)
                    .map((d) => new LocalFile(d.path, d.size));
                return new PendingUpload(stream.fileType(), firstBlock, lastBlock, estimatedBytes, files);
            })
            .filter((dl) => dl.firstBlock != dl.lastBlock)
            .filter((dl) => dl.fileType != FileType.Unknown)
            .sort((a, b) => {
                return a.fileType < b.fileType ? -1 : 1;
            });

        const downloaded = _.last(station.streams.filter((s) => s.fileType() == FileType.Data).map((s) => s.downloadLastBlock));
        const uploaded = _.last(station.streams.filter((s) => s.fileType() == FileType.Data).map((s) => s.portalLastBlock));

        return new StationSyncStatus(
            station.id,
            station.deviceId,
            station.generationId,
            station.name,
            connected !== null,
            lastSeen,
            now,
            downloaded || 0,
            uploaded || 0,
            downloads,
            uploads,
            station.locationString(),
            state.errors[station.deviceId] || TransferError.None,
            null
        );
    });

    return StationSyncsSorter(syncs);
}

const mutations = {
    [MutationTypes.RESET]: (state: SyncingState, error: string) => {
        Object.assign(state, new SyncingState());
    },
    [MutationTypes.STATIONS]: (state: SyncingState, stations: Station[]) => {
        Vue.set(state, "stations", stations);
        Vue.set(state, "syncs", makeStationSyncs(state));

        const pending = _(stations)
            .map((s) => s.downloads)
            .flatten()
            .filter((d) => d.uploaded === null)
            .keyBy((d) => d.path)
            .value();

        Vue.set(state, "pending", pending);
    },
    [MutationTypes.FIND]: (state: SyncingState, info: ServiceInfo) => {
        Vue.set(state.connected, info.deviceId, info);
        Vue.set(
            state,
            "syncs",
            StationSyncsSorter(
                state.syncs.map((sync) => {
                    if (sync.deviceId === info.deviceId) {
                        sync.connecting = true;
                        sync.disconnected = false;
                    }
                    return sync;
                })
            )
        );
    },
    [MutationTypes.LOSE]: (state: SyncingState, info: ServiceInfo) => {
        Vue.set(state.connected, info.deviceId, null);
        Vue.set(
            state,
            "syncs",
            StationSyncsSorter(
                state.syncs.map((sync) => {
                    if (sync.deviceId === info.deviceId) {
                        sync.connecting = false;
                        sync.disconnected = true;
                    }
                    return sync;
                })
            )
        );
    },
    [MutationTypes.TRANSFER_OPEN]: (state: SyncingState, payload: OpenProgressPayload) => {
        Vue.set(state.errors, payload.deviceId, TransferError.None);
        Vue.set(state.progress, payload.deviceId, new StationProgress(payload.deviceId, payload.downloading, payload.totalBytes));
        Vue.set(state, "syncs", makeStationSyncs(state));
    },
    [MutationTypes.TRANSFER_PROGRESS]: (state: SyncingState, progress: TransferProgress) => {
        const before = state.progress[progress.deviceId];
        if (!before) {
            console.log(`dropped progress: ${progress.deviceId}`);
            return;
        }
        Vue.set(state.progress, progress.deviceId, before.include(progress));
        Vue.set(state, "syncs", makeStationSyncs(state));
    },
    [MutationTypes.TRANSFER_CLOSE]: (state: SyncingState, deviceId: string) => {
        delete state.progress[deviceId];
        Vue.set(state, "syncs", makeStationSyncs(state));
    },
};

export const syncing = (services: ServiceRef) => {
    const state = () => new SyncingState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};

function parseBlocks(blocks: [string] | string) {
    if (Array.isArray(blocks)) {
        blocks = blocks[0];
    }

    if (!_.isString(blocks)) {
        throw new Error(`invalid fk-blocks header: ${blocks}`);
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
