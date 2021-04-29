import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import {
    ActionTypes,
    DownloadStationDataAction,
    UploadStationDataAction,
    DownloadAllStationsDataAction,
    UploadAllStationsDataAction,
} from "../actions";
import { MutationTypes, OpenProgressMutation } from "../mutations";
import {
    Station,
    Download,
    FileType,
    FileTypeUtils,
    TransferProgress,
    ServiceInfo,
    SortableStationSorter,
    StationSyncStatus,
    TransferError,
    PendingDownload,
    PendingUpload,
    LocalFile,
    StationProgress,
} from "../types";
import { ServiceRef, CalculatedSize } from "@/services";
import { serializePromiseChain, logChanges, getPathTimestamp, getFilePath, getFileName, AuthenticationError } from "@/lib";

import { logAnalytics } from "@/lib";

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
        return services.queryStation().calculateDownloadSize(download.url);
    });
}

export class ResetSyncStatusAction {
    type = ActionTypes.RESET_SYNC_STATUS;

    constructor(public readonly deviceId: string) {}
}

type ActionParameters = ActionContext<SyncingState, never>;

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.DOWNLOAD_ALL]: async ({ dispatch }: ActionParameters, payload: DownloadAllStationsDataAction): Promise<void> => {
            await Promise.all(payload.syncs.map((dl) => dispatch(new DownloadStationDataAction(dl))));
        },
        [ActionTypes.DOWNLOAD_STATION]: async (
            { commit, dispatch, state }: ActionParameters,
            payload: DownloadStationDataAction
        ): Promise<void> => {
            const sync = payload.sync;

            if (!sync.connected) {
                throw new Error("refusing to download from disconnected station");
            }

            if (state.busy[sync.deviceId]) {
                throw new Error("refusing to download while already busy");
            }

            const anyOffline = sync.downloads.filter((d) => isOfflineUrl(d.url));
            if (anyOffline.length > 0) {
                throw new Error("refusing to download from offline urls");
            }

            await logAnalytics("station_download");

            state.busy[sync.deviceId] = true;

            console.log("syncing:download", sync.downloads);

            await querySizes(services, sync.downloads)
                .then((sizes: CalculatedSize[]) => {
                    console.log("syncing:sizes", sizes);

                    const totalBytes = _.sum(sizes.map((s) => s.size));

                    commit(MutationTypes.TRANSFER_OPEN, new OpenProgressMutation(sync.deviceId, true, totalBytes));

                    return serializePromiseChain(sync.downloads, async (file: PendingDownload, index: number) => {
                        const size = sizes[index];
                        if (size.size == 0) {
                            return;
                        }
                        const fsFolder = services.fs().getFolder(getFilePath(file.path));
                        const fsFile = fsFolder.getFile(getFileName(file.path));
                        console.log("syncing:download", file.url, fsFile);
                        return await services
                            .queryStation()
                            .download(file.url, fsFile.path, (total: number, copied: number) => {
                                commit(MutationTypes.TRANSFER_PROGRESS, new TransferProgress(sync.deviceId, file.path, total, copied));
                            })
                            .then(({ headers }) => services.db().insertDownload(sync.makeRow(file, headers)))
                            .catch((error) => {
                                if (AuthenticationError.isInstance(error)) {
                                    Vue.set(state.errors, sync.deviceId, TransferError.Authentication);
                                } else {
                                    Vue.set(state.errors, sync.deviceId, TransferError.Other);
                                }
                                console.log(`error downloading: ${JSON.stringify(error)}`);
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
        [ActionTypes.UPLOAD_ALL]: async ({ dispatch }: ActionParameters, payload: UploadAllStationsDataAction): Promise<void> => {
            await Promise.all(payload.syncs.map((dl) => dispatch(new UploadStationDataAction(dl))));
        },
        [ActionTypes.UPLOAD_STATION]: async (
            { commit, dispatch, state }: ActionParameters,
            payload: UploadStationDataAction
        ): Promise<void> => {
            const sync = payload.sync;
            const paths = sync.getPathsToUpload();
            const downloads = paths.map((path) => state.pending[path]).filter((d) => d != null);
            if (downloads.length != paths.length) {
                throw new Error("download missing");
            }

            if (state.busy[sync.deviceId]) {
                throw new Error("refusing to upload while already busy");
            }

            await logAnalytics("station_upload");

            state.busy[sync.deviceId] = true;

            const totalBytes = _(downloads)
                .map((d) => d.size)
                .sum();

            console.log("syncing:upload", downloads, totalBytes);

            commit(MutationTypes.TRANSFER_OPEN, new OpenProgressMutation(sync.deviceId, false, totalBytes));

            try {
                await serializePromiseChain(downloads, (download: Download) => {
                    console.log("syncing:upload", sync.name, download);
                    return services
                        .portal()
                        .uploadPreviouslyDownloaded(sync.id, sync.name, download, (total: number, copied: number) => {
                            commit(MutationTypes.TRANSFER_PROGRESS, new TransferProgress(sync.deviceId, download.path, total, copied));
                        })
                        .then(() => services.db().markDownloadAsUploaded(download))
                        .catch((error) => {
                            if (AuthenticationError.isInstance(error)) {
                                console.log(`error uploading (auth): ${JSON.stringify(error)}`);
                                Vue.set(state.errors, sync.deviceId, TransferError.Authentication);
                            } else {
                                console.log(`error uploading (other) ${JSON.stringify(error)}`);
                                Vue.set(state.errors, sync.deviceId, TransferError.Other);
                            }
                            return Promise.reject(error);
                        });
                });
                await dispatch(new ResetSyncStatusAction(sync.deviceId));
                await dispatch(ActionTypes.LOAD);
            } finally {
                commit(MutationTypes.TRANSFER_CLOSE, sync.deviceId);
                state.busy[sync.deviceId] = false;
            }
        },
        [ActionTypes.RESET_SYNC_STATUS]: async (
            { commit, dispatch, state }: ActionParameters,
            payload: ResetSyncStatusAction
        ): Promise<void> => {
            const pendingDownloads = await services.db().getPendingStationDownloads(payload.deviceId);
            if (pendingDownloads.length > 0) {
                console.log("skipping sync resetting, has pending uploads");
                return;
            }

            const sync = state.syncs.find((s) => s.deviceId == payload.deviceId);
            if (!sync) throw new Error("missing sync for station");

            const downloads = await services.db().getStationGenerationDownloads(sync.deviceId, sync.generationId);
            const dataOnly = downloads.filter((d) => FileTypeUtils.fromString(d.type) == FileType.Data);
            const metaOnly = downloads.filter((d) => FileTypeUtils.fromString(d.type) == FileType.Meta);

            const streams = [
                {
                    fileType: FileType.Data,
                    firstBlock: _.min(dataOnly.map((d) => d.firstBlock)) || 0,
                    lastBlock: _.max(dataOnly.map((d) => d.lastBlock)) || 0,
                },
                {
                    fileType: FileType.Meta,
                    firstBlock: _.min(metaOnly.map((d) => d.firstBlock)) || 0,
                    lastBlock: _.max(metaOnly.map((d) => d.lastBlock)) || 0,
                },
            ];

            console.log(
                dataOnly.map((d) => d.firstBlock),
                _.min(dataOnly.map((d) => d.firstBlock)) || 0
            );
            console.log(
                dataOnly.map((d) => d.lastBlock),
                _.max(dataOnly.map((d) => d.lastBlock)) || 0
            );

            const resetStatus = {
                generationId: sync.generationId,
                dataOnly,
                metaOnly,
                streams,
            };

            const station = state.stations.find((s) => s.deviceId == sync.deviceId);
            if (!station || !station.id) throw new Error("no station for device id");

            console.log(`resetting sync status: ${JSON.stringify(resetStatus)}`);

            await services.db().resetSyncStatus(station.id, sync.deviceId, sync.generationId, streams);
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

const OfflineUrl = "https://www.fieldkit.org/off-line-bug";

function isOfflineUrl(url: string): boolean {
    return url.indexOf("off-line-bug") >= 0;
}

function makeStationSyncs(state: SyncingState): StationSyncStatus[] {
    const now = new Date();
    const syncs = state.stations.map((station) => {
        if (!station.id || !station.generationId || !station.name || !station.lastSeen) {
            throw new Error("id, generationId, lastSeen, and name are required");
        }

        const connected = state.connected[station.deviceId] || null;
        const lastSeen = station.lastSeen;
        const baseUrl = connected ? connected.url : OfflineUrl;

        const relevantStreams = station.streams.filter((d) => d.generationId == station.generationId);
        const downloads = relevantStreams
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

        // This isn't using relevantStreams because these just get
        // uploaded and that's not a problem. This way they can sync,
        // factory reset and then download more data.
        const uploads = station.streams
            .map((stream) => {
                const lastBlock = stream.downloadLastBlock || 0;
                const firstBlock = (stream.portalLastBlock || 0) > lastBlock ? lastBlock : stream.portalLastBlock || 0;
                const estimatedBytes = (stream.downloadSize || 0) - (stream.portalSize || 0);
                const files = station.downloads
                    .filter((d) => d.fileType == stream.fileType())
                    .filter((d) => d.generationId == stream.generationId)
                    .filter((d) => !d.uploaded)
                    .map((d) => new LocalFile(d.path, d.size));
                return new PendingUpload(stream.fileType(), firstBlock, lastBlock, estimatedBytes, files);
            })
            .filter((dl) => dl.firstBlock != dl.lastBlock)
            .filter((dl) => dl.fileType != FileType.Unknown)
            .sort((a, b) => {
                return a.fileType < b.fileType ? -1 : 1;
            });

        const downloaded = _.last(relevantStreams.filter((s) => s.fileType() == FileType.Data).map((s) => s.downloadLastBlock));
        const uploaded = _.last(relevantStreams.filter((s) => s.fileType() == FileType.Data).map((s) => s.portalLastBlock));
        const wasConnected = connected !== null;

        const syncStatus = new StationSyncStatus(
            station.id,
            station.deviceId,
            station.generationId,
            station.name,
            wasConnected,
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

        logChanges(`[${station.deviceId}] sync-status:`, syncStatus);

        return syncStatus;
    });

    return StationSyncsSorter(syncs);
}

const mutations = {
    [MutationTypes.RESET]: (state: SyncingState) => {
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
    [MutationTypes.TRANSFER_OPEN]: (state: SyncingState, payload: OpenProgressMutation) => {
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

type ModuleType = Module<SyncingState, never>;

export const syncing = (services: ServiceRef): ModuleType => {
    const state = () => new SyncingState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
