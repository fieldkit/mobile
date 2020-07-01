import _ from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Station, FileType, FileTypeUtils } from "../types";
import { Services, ServiceRef } from "./utilities";
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

export class FileDownload {
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

export class StationDownloads {
    constructor(
        public readonly id: number,
        public readonly deviceId: string,
        public readonly generation: string,
        public readonly name: string,
        public readonly connected: boolean,
        public readonly busy: boolean,
        public readonly time: Date,
        public readonly pending: boolean,
        public readonly files: FileDownload[]
    ) {}

    get readings(): number {
        return 0;
    }

    get bytes(): number {
        return 0;
    }

    makeRowsFromPending(): DownloadTableRow[] {
        return this.files.map(f => {
            return {
                stationId: this.id,
                deviceId: this.deviceId,
                generation: this.generation,
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
    downloads: StationDownloads[] = [];
}

const actions = {
    [ActionTypes.DOWNLOAD_ALL]: (
        { commit, dispatch, state }: { commit: any; dispatch: any; state: SyncingState },
        fake: boolean = false
    ) => {
        return Promise.all(state.downloads.map(dl => dispatch(DOWNLOAD_COMPLETED, dl)));
    },
    [CALCULATE_SIZE]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: SyncingState }, file: FileDownload) => {
        // calculate size
    },
    [DOWNLOAD_COMPLETED]: (
        { commit, dispatch, state }: { commit: any; dispatch: any; state: SyncingState },
        downloads: StationDownloads
    ) => {
        return Promise.all(downloads.makeRowsFromPending().map(row => state.services.db().insertDownload(row))).then(() =>
            state.services
                .db()
                .getAllDownloads()
                .then(all => dispatch(ActionTypes.LOAD))
        );
    },
};

const getters = {};

const mutations = {
    [MutationTypes.SERVICES]: (state: SyncingState, services: () => Services) => {
        state.services = new ServiceRef(services);
    },
    [MutationTypes.STATIONS]: (state: SyncingState, stations: Station[]) => {
        const now = new Date();

        state.downloads = stations.map(station => {
            const files = station.streams
                .map(stream => {
                    const firstBlock = stream.downloadLastBlock || 0;
                    const lastBlock = stream.deviceLastBlock;
                    const estimatedBytes = stream.deviceSize - (stream.downloadSize || 0);
                    const typeName = FileTypeUtils.toString(stream.fileType());
                    const path = [station.deviceId, getPathTimestamp(now), typeName + ".fkpb"].join("/");
                    const url = "/fk/v1/download/" + typeName + (firstBlock > 0 ? "?first=" + firstBlock : "");
                    return new FileDownload(stream.fileType(), url, path, firstBlock, lastBlock, estimatedBytes);
                })
                .filter(dl => dl.firstBlock != dl.lastBlock)
                .filter(dl => dl.fileType != FileType.Unknown)
                .sort((a, b) => {
                    return a.fileType < b.fileType ? -1 : 1;
                });
            if (!station.id) {
                throw new Error("unexpected null station.id: " + station.name);
            }
            return new StationDownloads(station.id, station.deviceId, station.generationId, station.name, false, false, now, true, files);
        });
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
