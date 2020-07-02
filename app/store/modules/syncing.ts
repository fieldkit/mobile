import _ from "lodash";
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Station, FileType, FileTypeUtils } from "../types";
import { Services, ServiceRef } from "./utilities";
import { GlobalGetters } from "./global";
import { serializePromiseChain, getPathTimestamp } from "../../utilities";
import { DownloadTableRow } from "../row-types";

export class TransferProgress {
    constructor(
        public readonly deviceId: string,
        public readonly path: string,
        public readonly total: number,
        public readonly copied: number
    ) {}

    get decimal(): number {
        return this.copied / this.total;
    }

    get percentage(): string {
        return (this.decimal * 100.0).toFixed(0) + "%";
    }
}

export class FileUpload {
    constructor(
        public readonly fileType: FileType,
        public readonly firstBlock: number,
        public readonly lastBlock: number,
        public readonly bytes: number,
        public readonly progress: TransferProgress | null = null
    ) {}

    get blocks(): number {
        return this.lastBlock - this.firstBlock;
    }
}

export class FileDownload {
    constructor(
        public readonly fileType: FileType,
        public readonly url: string,
        public readonly path: string,
        public readonly firstBlock: number,
        public readonly lastBlock: number,
        public readonly bytes: number,
        public readonly progress: TransferProgress | null = null
    ) {}

    get blocks(): number {
        return this.lastBlock - this.firstBlock;
    }

    name(): string {
        return FileTypeUtils.toString(this.fileType) + ".fkpb";
    }
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
        private readonly downloaded,
        public readonly downloads: FileDownload[] = [],
        public readonly uploads: FileUpload[] = []
    ) {}

    private get data(): FileDownload[] {
        return this.downloads.filter(file => file.fileType == FileType.Data);
    }

    get progress(): TransferProgress | null {
        return (
            this.downloads
                .filter(p => p.progress)
                .map(p => p.progress)
                .find(p => true) || null
        );
    }

    readingsReady(): number {
        return _.sum(this.data.map(f => f.blocks)) || 0;
    }

    readingsCopying(): number {
        return this.readingsReady();
    }

    readingsHave(): number {
        return this.downloaded;
    }

    showReady(): boolean {
        return false;
    }

    showCopying(): boolean {
        return false;
    }

    showHave(): boolean {
        return false;
    }

    makeRow(file: FileDownload): DownloadTableRow {
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
            blocks: [file.firstBlock, file.lastBlock].join(","),
            firstBlock: file.firstBlock,
            lastBlock: file.lastBlock,
        };
    }
}

export class SyncingState {
    services: ServiceRef = new ServiceRef();
    stations: Station[] = [];
    clock: Date = new Date();
    progress: { [index: string]: TransferProgress } = {};
}

type ActionParameters = { commit: any; dispatch: any; state: SyncingState };

const actions = {
    [ActionTypes.DOWNLOAD_STATION]: ({ commit, dispatch, state }: ActionParameters, sync: StationSyncStatus) => {
        return Promise.all([sync].map(dl => dispatch(ActionTypes.DOWNLOAD_COMPLETED, dl)));
    },
    [ActionTypes.DOWNLOAD_ALL]: ({ commit, dispatch, state }: ActionParameters, syncs: StationSyncStatus[]) => {
        return Promise.all(syncs.map(dl => dispatch(ActionTypes.DOWNLOAD_COMPLETED, dl)));
    },
    [ActionTypes.DOWNLOAD_COMPLETED]: ({ commit, dispatch, state }: ActionParameters, sync: StationSyncStatus) => {
        return serializePromiseChain(sync.downloads, file => {
            if (true) {
                return state.services
                    .queryStation()
                    .download(file.url, file.path, (total, copied, info) => {
                        commit(MutationTypes.TRANSFER_PROGRESS, new TransferProgress(sync.deviceId, file.path, total, copied));
                    })
                    .then(() => state.services.db().insertDownload(sync.makeRow(file)))
                    .catch(error => {
                        console.log("error downloading", error, error ? error.stack : null);
                    });
            }
            return true;
        }).then(() => dispatch(ActionTypes.LOAD));
    },
};

const getters = {
    syncs: (state: SyncingState, _getters: never, rootState: never, rootGetters: GlobalGetters): StationSyncStatus[] => {
        return state.stations.map(station => {
            if (!station.id) {
                throw new Error("unexpected null station.id: " + station.name);
            }

            const available = rootGetters.availableStations.find(s => s.deviceId == station.deviceId);
            if (!available) {
                throw new Error("expected available station, missing");
            }
            const connected = available.connected;
            const lastSeen = station.lastSeen;
            const baseUrl = available.url || "";

            const downloads = station.streams
                .map(stream => {
                    const firstBlock = stream.downloadLastBlock || 0;
                    const lastBlock = stream.deviceLastBlock;
                    const estimatedBytes = stream.deviceSize - (stream.downloadSize || 0);
                    const typeName = FileTypeUtils.toString(stream.fileType());
                    const path = ["downloads", station.deviceId, getPathTimestamp(state.clock)].join("/");
                    const url = baseUrl + "/download/" + typeName + (firstBlock > 0 ? "?first=" + firstBlock : "");
                    const folder = state.services.fs().getFolder(path);
                    const file = folder.getFile(FileTypeUtils.toString(stream.fileType()) + ".fkpb");
                    const progress = state.progress[file.path];
                    return new FileDownload(stream.fileType(), url, file.path, firstBlock, lastBlock, estimatedBytes, progress);
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
                    return new FileUpload(stream.fileType(), firstBlock, lastBlock, estimatedBytes, null);
                })
                .filter(dl => dl.firstBlock != dl.lastBlock)
                .filter(dl => dl.fileType != FileType.Unknown)
                .sort((a, b) => {
                    return a.fileType < b.fileType ? -1 : 1;
                });

            const downloaded = _.sum(station.streams.filter(s => s.fileType() == FileType.Data).map(s => s.downloadLastBlock));

            return new StationSyncStatus(
                station.id,
                station.deviceId,
                station.generationId,
                station.name,
                connected,
                lastSeen,
                state.clock,
                downloaded || 0,
                downloads,
                uploads
            );
        });
    },
};

const mutations = {
    [MutationTypes.SERVICES]: (state: SyncingState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
    },
    [MutationTypes.STATIONS]: (state: SyncingState, stations: Station[]) => {
        Vue.set(state, "clock", new Date());
        Vue.set(state, "stations", stations);
    },
    [MutationTypes.TRANSFER_PROGRESS]: (state: SyncingState, progress: TransferProgress) => {
        Vue.set(state.progress, progress.path, progress);
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
