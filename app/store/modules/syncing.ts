import _ from "lodash";
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Station, Download, FileType, FileTypeUtils, OpenProgressPayload, TransferProgress, ServiceInfo } from "../types";
import { Services, ServiceRef } from "./utilities";
import { serializePromiseChain, getPathTimestamp } from "../../utilities";
import { DownloadTableRow } from "../row-types";

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

    private incomplete(): TransferProgress[] {
        return Object.values(this.transfers).filter(t => t.copied < t.total);
    }

    private get copiedBytes(): number {
        return _.sum(Object.values(this.transfers).map(t => t.copied));
    }

    public get decimal(): number {
        if (this.totalBytes > 0) {
            return this.copiedBytes / this.totalBytes;
        }

        const incomplete = this.incomplete();
        const total = _.sum(incomplete.map(i => i.total));
        const copied = _.sum(incomplete.map(i => i.copied));
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

export class StationSyncStatus {
    constructor(
        public readonly id: number,
        public readonly deviceId: string,
        private readonly generationId: string,
        public readonly name: string,
        public readonly connected: boolean,
        public readonly lastSeen: Date,
        public readonly time: Date,
        private readonly downloaded: number,
        private readonly uploaded: number,
        public readonly downloads: PendingDownload[] = [],
        public readonly uploads: PendingUpload[] = [],
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
        return _.sum(this.downloads.filter(file => file.fileType == FileType.Data).map(f => f.blocks)) || 0;
    }

    public get readingsOutgoing(): number {
        return _.sum(this.uploads.filter(file => file.fileType == FileType.Data).map(f => f.blocks)) || 0;
    }

    public get readingsReady(): number {
        return this.readingsIncoming || this.readingsOutgoing;
    }

    public getPathsToUpload(): string[] {
        return _(this.uploads)
            .map(u => u.files)
            .flatten()
            .map(f => f.path)
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

export class SyncingState {
    services: ServiceRef = new ServiceRef();
    syncs: StationSyncStatus[] = [];
    progress: { [index: string]: StationProgress } = {};
    pending: { [index: string]: Download } = {};
    connected: { [index: string]: ServiceInfo } = {};
}

type ActionParameters = { commit: any; dispatch: any; state: SyncingState };

const actions = {
    [ActionTypes.DOWNLOAD_ALL]: ({ commit, dispatch, state }: ActionParameters, syncs: StationSyncStatus[]) => {
        return Promise.all(syncs.map(dl => dispatch(ActionTypes.DOWNLOAD_STATION, dl)));
    },
    [ActionTypes.DOWNLOAD_STATION]: ({ commit, dispatch, state }: ActionParameters, sync: StationSyncStatus) => {
        if (!sync.connected) {
            throw new Error("refusing to download from disconnected station");
        }

        commit(MutationTypes.TRANSFER_OPEN, new OpenProgressPayload(sync.deviceId, true, 0));

        return serializePromiseChain(sync.downloads, file => {
            return state.services
                .queryStation()
                .download(file.url, file.path, (total, copied, info) => {
                    commit(MutationTypes.TRANSFER_PROGRESS, new TransferProgress(sync.deviceId, file.path, total, copied));
                })
                .then(({ headers }) => state.services.db().insertDownload(sync.makeRow(file, headers)))
                .catch(error => {
                    console.log("error downloading", error, error ? error.stack : null);
                    return Promise.reject(error);
                });
        })
            .then(() => dispatch(ActionTypes.LOAD))
            .finally(() => {
                commit(MutationTypes.TRANSFER_CLOSE, sync.deviceId);
            });
    },
    [ActionTypes.UPLOAD_ALL]: ({ commit, dispatch, state }: ActionParameters, syncs: StationSyncStatus[]) => {
        return Promise.all(syncs.map(dl => dispatch(ActionTypes.UPLOAD_STATION, dl)));
    },
    [ActionTypes.UPLOAD_STATION]: ({ commit, dispatch, state }: ActionParameters, sync: StationSyncStatus) => {
        const paths = sync.getPathsToUpload();
        const downloads = paths.map(path => state.pending[path]).filter(d => d != null);
        if (downloads.length != paths.length) {
            throw new Error("download missing");
        }

        const totalBytes = _(downloads)
            .map(d => d.size)
            .sum();

        commit(MutationTypes.TRANSFER_OPEN, new OpenProgressPayload(sync.deviceId, false, totalBytes));

        return serializePromiseChain(downloads, download => {
            return state.services
                .portal()
                .uploadPreviouslyDownloaded(sync.name, download, (total, copied, info) => {
                    commit(MutationTypes.TRANSFER_PROGRESS, new TransferProgress(sync.deviceId, download.path, total, copied));
                })
                .then(({ headers }) => state.services.db().markDownloadAsUploaded(download))
                .catch(error => {
                    console.log("error uploading", error, error ? error.stack : null);
                    return Promise.reject(error);
                });
        })
            .then(() => dispatch(ActionTypes.LOAD))
            .finally(() => {
                commit(MutationTypes.TRANSFER_CLOSE, sync.deviceId);
            });
    },
};

const getters = {
    syncs: (state: SyncingState): StationSyncStatus[] => {
        return state.syncs.map(sync => {
            return sync.withProgress(state.progress[sync.deviceId]);
        });
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: SyncingState, error: string) => {
        Object.assign(state, new SyncingState());
    },
    [MutationTypes.SERVICES]: (state: SyncingState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
    },
    [MutationTypes.STATIONS]: (state: SyncingState, stations: Station[]) => {
        const now = new Date();
        const syncs = stations.map(station => {
            if (!station.id || !station.generationId || !station.name || !station.lastSeen) {
                throw new Error("id, generationId, and name are required");
            }

            const connected = state.connected[station.deviceId] || null;
            const lastSeen = station.lastSeen;
            const baseUrl = connected ? connected.url : "https://www.fieldkit.org/off-line-bug";

            const downloads = station.streams
                .map(stream => {
                    const firstBlock = stream.downloadLastBlock || 0;
                    const lastBlock = stream.deviceLastBlock;
                    const estimatedBytes = stream.deviceSize - (stream.downloadSize || 0);
                    const typeName = FileTypeUtils.toString(stream.fileType());
                    const path = ["downloads", station.deviceId, getPathTimestamp(now)].join("/");
                    const url = baseUrl + "/download/" + typeName + (firstBlock > 0 ? "?first=" + firstBlock : "");
                    const folder = state.services.fs().getFolder(path);
                    const file = folder.getFile(FileTypeUtils.toString(stream.fileType()) + ".fkpb");
                    const pending = new PendingDownload(stream.fileType(), url, file.path, firstBlock, lastBlock, estimatedBytes);
                    return pending;
                })
                .filter(dl => dl.firstBlock != dl.lastBlock)
                .filter(dl => dl.fileType != FileType.Unknown)
                .sort((a, b) => {
                    return a.fileType < b.fileType ? -1 : 1;
                });

            const uploads = station.streams
                .map(stream => {
                    const firstBlock = stream.portalLastBlock || 0;
                    const lastBlock = stream.downloadLastBlock || 0;
                    const estimatedBytes = (stream.downloadSize || 0) - (stream.portalSize || 0);
                    const files = station.downloads
                        .filter(d => d.fileType == stream.fileType())
                        .filter(d => !d.uploaded)
                        .map(d => new LocalFile(d.path, d.size));
                    const pending = new PendingUpload(stream.fileType(), firstBlock, lastBlock, estimatedBytes, files);
                    return pending;
                })
                .filter(dl => dl.firstBlock != dl.lastBlock)
                .filter(dl => dl.fileType != FileType.Unknown)
                .sort((a, b) => {
                    return a.fileType < b.fileType ? -1 : 1;
                });

            const downloaded = _.sum(station.streams.filter(s => s.fileType() == FileType.Data).map(s => s.downloadLastBlock));
            const uploaded = _.sum(station.streams.filter(s => s.fileType() == FileType.Data).map(s => s.portalLastBlock));

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
                null
            );
        });

        Vue.set(state, "syncs", syncs);

        const pending = _(stations)
            .map(s => s.downloads)
            .flatten()
            .filter(d => d.uploaded === null)
            .keyBy(d => d.path)
            .value();

        Vue.set(state, "pending", pending);
    },
    [MutationTypes.FIND]: (state: SyncingState, info: ServiceInfo) => {
        Vue.set(state.connected, info.deviceId, info);
    },
    [MutationTypes.LOSE]: (state: SyncingState, info: ServiceInfo) => {
        Vue.set(state.connected, info.deviceId, null);
    },
    [MutationTypes.TRANSFER_OPEN]: (state: SyncingState, payload: OpenProgressPayload) => {
        Vue.set(state.progress, payload.deviceId, new StationProgress(payload.deviceId, payload.downloading, payload.totalBytes));
    },
    [MutationTypes.TRANSFER_PROGRESS]: (state: SyncingState, progress: TransferProgress) => {
        const before = state.progress[progress.deviceId];
        Vue.set(state.progress, progress.deviceId, before.include(progress));
    },
    [MutationTypes.TRANSFER_CLOSE]: (state: SyncingState, deviceId: string) => {
        delete state.progress[deviceId];
    },
};

const state = () => new SyncingState();

export const syncing = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};

function parseBlocks(blocks) {
    if (Array.isArray(blocks)) {
        blocks = blocks[0];
    }

    if (!_.isString(blocks)) {
        throw new Error("invalid fk-blocks header: " + blocks);
    }

    const parts = blocks
        .split(",")
        .map(s => s.trim())
        .map(s => Number(s));
    if (parts.length != 2) {
        throw new Error("invalid fk-blocks header: " + blocks);
    }

    return {
        range: parts.join(","),
        firstBlock: parts[0],
        lastBlock: parts[1],
    };
}
