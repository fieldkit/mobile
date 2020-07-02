import _ from "lodash";
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Station, FileType, FileTypeUtils } from "../types";
import { Services, ServiceRef } from "./utilities";
import { GlobalGetters } from "./global";
import { getPathTimestamp } from "../../utilities";

export const CALCULATE_SIZE = "CALCULATE_SIZE";
export const DOWNLOAD_COMPLETED = "DOWNLOAD_COMPLETED";
export const DOWNLOADS_LOADED = "DOWNLOADS_LOADED";

export interface DownloadTableRow {
    stationId: number;
    deviceId: string;
    generation: string;
    path: string;
    type: string;
    timestamp: number;
    url: string;
    size: number;
    blocks: string;
    firstBlock: number;
    lastBlock: number;
}

export class TransferProgress {
    constructor(public readonly total: number, public readonly copied: number) {}
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
}

export class StationSyncStatus {
    constructor(
        public readonly id: number,
        public readonly deviceId: string,
        public readonly generationId: string,
        public readonly name: string,
        public readonly connected: boolean,
        public readonly lastSeen: Date,
        public readonly time: Date,
        public readonly pending: FileDownload[] = [],
        public readonly downloaded = 0
    ) {}

    get data(): FileDownload[] {
        return this.pending.filter(file => file.fileType == FileType.Data);
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

    makeRowsFromPending(): DownloadTableRow[] {
        return this.pending.map(f => {
            return {
                stationId: this.id,
                deviceId: this.deviceId,
                generation: this.generationId,
                path: f.path,
                type: FileTypeUtils.toString(f.fileType),
                timestamp: this.time.getTime(),
                url: f.url,
                size: f.bytes,
                blocks: [f.firstBlock, f.lastBlock].join(","),
                firstBlock: f.firstBlock,
                lastBlock: f.lastBlock,
            };
        });
    }
}

export class SyncingState {
    services: ServiceRef = new ServiceRef();
    stations: Station[] = [];
    clock: Date = new Date();
}

const actions = {
    [ActionTypes.DOWNLOAD_STATION]: (
        { commit, dispatch, state }: { commit: any; dispatch: any; state: SyncingState },
        sync: StationSyncStatus
    ) => {
        return Promise.all([sync].map(dl => dispatch(DOWNLOAD_COMPLETED, dl)));
    },
    [ActionTypes.DOWNLOAD_ALL]: (
        { commit, dispatch, state }: { commit: any; dispatch: any; state: SyncingState },
        syncs: StationSyncStatus[]
    ) => {
        return Promise.all(syncs.map(dl => dispatch(DOWNLOAD_COMPLETED, dl)));
    },
    [DOWNLOAD_COMPLETED]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: SyncingState }, sync: StationSyncStatus) => {
        return Promise.all(sync.makeRowsFromPending().map(row => state.services.db().insertDownload(row))).then(() =>
            state.services
                .db()
                .getAllDownloads()
                .then(all => dispatch(ActionTypes.LOAD))
        );
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

            const pending = station.streams
                .map(stream => {
                    const firstBlock = stream.downloadLastBlock || 0;
                    const lastBlock = stream.deviceLastBlock;
                    const estimatedBytes = stream.deviceSize - (stream.downloadSize || 0);
                    const typeName = FileTypeUtils.toString(stream.fileType());
                    const path = [station.deviceId, getPathTimestamp(state.clock), typeName + ".fkpb"].join("/");
                    const url = "/fk/v1/download/" + typeName + (firstBlock > 0 ? "?first=" + firstBlock : "");
                    const progress: number | null = null;
                    console.log("refresh sync", stream.downloadLastBlock);
                    return new FileDownload(stream.fileType(), url, path, firstBlock, lastBlock, estimatedBytes, progress);
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
                pending,
                downloaded || 0
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
};

const state = () => new SyncingState();

export const syncing = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
