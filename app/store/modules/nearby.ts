import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { MutationTypes } from "../mutations";
import { QueryThrottledError } from "../../lib/errors";
import { ServiceInfo, NearbyStation, TransferProgress, PhoneLocation, CommonLocations } from "../types";
import {
    ActionTypes,
    StationRepliedAction,
    ConfigureStationNetworksAction,
    RemoveStationNetworkAction,
    AddStationNetworkAction,
    TryStationAction,
    TryStationOnceAction,
    ConfigureStationSchedulesAction,
    NetworkChangedAction,
    ScanForStationsAction,
    RenameStationAction,
} from "@/store/actions";
import { OpenProgressMutation, RenameStationMutation } from "@/store/mutations";
import { ServiceRef } from "@/services";

import { backOff } from "exponential-backoff";

import { logAnalytics } from "@/lib";

export class NearbyState {
    stations: { [index: string]: NearbyStation } = {};
    expired: { [index: string]: NearbyStation } = {};
    location: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
}

type ActionParameters = ActionContext<NearbyState, never>;

type ModuleType = Module<NearbyState, never>;

class NearbyWrapper {
    constructor(private readonly state: NearbyState) {}

    public queriedRecentlyByDeviceId(deviceId: string): boolean {
        const nearby = this.state.stations[deviceId];
        if (!nearby) {
            return false;
        }
        return this.queriedRecently(nearby);
    }

    public isNewDiscovery(deviceId: string): boolean {
        if (this.state.stations[deviceId]) {
            return false;
        }
        return true;
    }

    public queriedRecently(nearby: NearbyStation): boolean {
        if (nearby.transferring) {
            return true;
        }
        const mark = nearby.activity.getTime() > nearby.queried.getTime() ? nearby.activity : nearby.queried;
        const now = new Date();
        const elapsed = now.getTime() - mark.getTime();
        return elapsed < nearby.delay;
    }

    public needsQuerying(): NearbyStation[] {
        return Object.values(this.state.stations).filter((nearby: NearbyStation) => {
            return !this.queriedRecently(nearby);
        });
    }
}

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.SCAN_FOR_STATIONS]: async ({ dispatch, state }: ActionParameters) => {
            await services.discovery().restart();
            const candidates = await services.db().queryRecentlyActiveAddresses();
            console.log(
                "nearby:scan",
                candidates.map((c) => {
                    const now = new Date();
                    const row = new Date(c.time);
                    const minutes = (now.getTime() - row.getTime()) / 1000 / 60;
                    return _.extend(
                        {
                            minutes: minutes,
                        },
                        c
                    );
                })
            );
            const offline = _.groupBy(candidates, (info) => info.url);
            const tries = _.mapValues(offline, (candidates) =>
                dispatch(new TryStationOnceAction(candidates[0])).catch((_err) => {
                    return Promise.resolve({ error: true });
                })
            );
            await Promise.all(Object.values(tries));
        },
        [ActionTypes.REFRESH]: async ({ dispatch, state }: ActionParameters) => {
            const now = new Date();
            await Promise.all(
                Object.values(state.stations).map((nearby) => {
                    if (!nearby.transferring && (nearby.old(now) || nearby.tooManyFailures())) {
                        console.log("station inactive, losing", nearby.info.deviceId, now.getTime() - nearby.activity.getTime());
                        return dispatch(ActionTypes.LOST, nearby.info);
                    }
                    return {};
                })
            ).then(() => dispatch(ActionTypes.QUERY_NECESSARY));
        },
        [ActionTypes.FOUND]: async ({ commit, dispatch, state }: ActionParameters, info: ServiceInfo) => {
            const wrapper = new NearbyWrapper(state);
            const newDiscovery = wrapper.isNewDiscovery(info.deviceId);
            if (wrapper.queriedRecentlyByDeviceId(info.deviceId)) {
                return;
            }
            commit(MutationTypes.FIND, info);
            try {
                await dispatch(ActionTypes.QUERY_STATION, info);
            } catch (error) {
                console.log(`found query error: ${JSON.stringify(error)} ${JSON.stringify(newDiscovery)}`);
                if (newDiscovery) {
                    await dispatch(
                        new TryStationAction(info, {
                            numOfAttempts: 1,
                            startingDelay: 250,
                            delayFirstAttempt: true,
                        })
                    );
                    console.log(`done with second query`);
                } else {
                    throw error;
                }
            }
            return;
        },
        [ActionTypes.MAYBE_LOST]: async ({ dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            const info = state.stations[payload.deviceId] || state.expired[payload.deviceId];
            if (info && !info.transferring) {
                await dispatch(ActionTypes.QUERY_STATION, info).catch(() => dispatch(ActionTypes.LOST, payload));
            }
        },
        [ActionTypes.LOST]: ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            const info = state.stations[payload.deviceId]?.info || null;
            commit(MutationTypes.LOSE, payload);
            if (info) {
                void dispatch(new TryStationAction(info));
            }
            return;
        },
        [ActionTypes.TRY_STATION]: async ({ commit, dispatch, state }: ActionParameters, payload: TryStationAction) => {
            if (!payload) throw new Error("payload required");
            if (!payload.info) throw new Error("payload.info required");
            console.log(`try-station start: ${JSON.stringify(payload.backOffOptions)}`);
            await backOff(
                () => dispatch(new TryStationOnceAction(payload.info)),
                payload.backOffOptions || {
                    maxDelay: 30000,
                    numOfAttempts: 4,
                    startingDelay: 250,
                }
            );
            console.log("try-station done");
        },
        [ActionTypes.TRY_STATION_ONCE]: async ({ commit, dispatch, state }: ActionParameters, payload: TryStationOnceAction) => {
            if (!payload) throw new Error("payload required");
            if (!payload.info) throw new Error("payload.info required");
            await services
                .queryStation()
                .takeReadings(payload.info.url, state.location, { throttle: false })
                .then((statusReply) => {
                    // Correct the device id, just incase we're trying an unknown one.
                    const expected = payload.info.deviceId;
                    const actual = statusReply.status.identity.deviceId;
                    const infoCorected: ServiceInfo = {
                        deviceId: actual,
                        url: payload.info.url,
                    };
                    if (expected != actual) {
                        console.log(`correcting device-id: ${payload.info.url} ${expected} ${actual}`);
                    }
                    commit(MutationTypes.FIND, infoCorected);
                    commit(MutationTypes.STATION_QUERIED, infoCorected);
                    commit(MutationTypes.STATION_ACTIVITY, infoCorected);
                    return dispatch(new StationRepliedAction(statusReply, payload.info.url), { root: true });
                });
        },
        [ActionTypes.QUERY_STATION]: ({ commit, dispatch, state }: ActionParameters, info: ServiceInfo) => {
            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .takeReadings(info.url, state.location)
                .then(
                    (statusReply) => {
                        commit(MutationTypes.STATION_ACTIVITY, info);
                        return dispatch(new StationRepliedAction(statusReply, info.url), { root: true });
                    },
                    (error) => {
                        if (QueryThrottledError.isInstance(error)) {
                            console.log(`query-station:throttle`);
                            return Promise.resolve();
                        }
                        return Promise.reject(error);
                    }
                );
        },
        [ActionTypes.QUERY_NECESSARY]: ({ commit, dispatch, state }: ActionParameters) => {
            const wrapper = new NearbyWrapper(state);
            return Promise.all(
                wrapper.needsQuerying().map((nearby: NearbyStation) =>
                    dispatch(ActionTypes.QUERY_STATION, nearby.info).then(
                        () => nearby.success(),
                        () => nearby.failure()
                    )
                )
            );
        },
        [ActionTypes.NETWORK_CHANGED]: async ({ commit, dispatch, state }: ActionParameters, payload: NetworkChangedAction) => {
            if (payload.network.ssid != null) {
                await dispatch(new ScanForStationsAction({ wifi: true }));
            } else {
                console.log(`losing stations: ${JSON.stringify(state)}`);
                for (const key of Object.keys(state.stations)) {
                    commit(MutationTypes.LOSE, { deviceId: key });
                }
            }
        },
        [ActionTypes.RENAME_STATION]: ({ commit, dispatch, state }: ActionParameters, payload: RenameStationAction) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");

            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .configureName(info.url, payload.name)
                .then(
                    (statusReply) => {
                        commit(new RenameStationMutation(payload.deviceId, payload.name));
                        commit(MutationTypes.STATION_ACTIVITY, info);
                        return dispatch(new StationRepliedAction(statusReply, info.url), { root: true });
                    },
                    (error) => {
                        if (error instanceof QueryThrottledError) {
                            return error;
                        }
                        return Promise.reject(error);
                    }
                );
        },
        [ActionTypes.CONFIGURE_STATION_ADD_NETWORK]: ({ commit, dispatch, state }: ActionParameters, payload: AddStationNetworkAction) => {
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");
            const setting = _.take([payload.adding, ...payload.networks], 2);
            return dispatch(new ConfigureStationNetworksAction(payload.deviceId, setting));
        },
        [ActionTypes.CONFIGURE_STATION_REMOVE_NETWORK]: (
            { commit, dispatch, state }: ActionParameters,
            payload: RemoveStationNetworkAction
        ) => {
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");
            const setting = payload.networks.filter((n) => n.ssid != payload.removing.ssid);
            return dispatch(new ConfigureStationNetworksAction(payload.deviceId, setting));
        },
        [ActionTypes.CONFIGURE_STATION_SET_NETWORKS]: (
            { commit, dispatch, state }: ActionParameters,
            payload: ConfigureStationNetworksAction
        ) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");

            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .sendNetworkSettings(info.url, payload.networks)
                .then(
                    (statusReply) => {
                        commit(MutationTypes.STATION_ACTIVITY, info);
                        return dispatch(new StationRepliedAction(statusReply, info.url), { root: true });
                    },
                    (error) => {
                        if (error instanceof QueryThrottledError) {
                            return error;
                        }
                        return Promise.reject(error);
                    }
                );
        },
        [ActionTypes.CONFIGURE_STATION_SCHEDULES]: (
            { commit, dispatch, state }: ActionParameters,
            payload: ConfigureStationSchedulesAction
        ) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");

            const schedules = { ...payload.existing, ...payload.modifying };

            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .configureSchedule(info.url, schedules)
                .then(
                    (statusReply) => {
                        commit(MutationTypes.STATION_ACTIVITY, info);
                        return dispatch(new StationRepliedAction(statusReply, info.url), { root: true });
                    },
                    (error) => {
                        if (error instanceof QueryThrottledError) {
                            return error;
                        }
                        return Promise.reject(error);
                    }
                );
        },
        [ActionTypes.DEPLOY_STATION]: async ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");
            commit(MutationTypes.STATION_QUERIED, info);
            await services
                .queryStation()
                .startDataRecording(info.url)
                .then(
                    (statusReply) => {
                        commit(MutationTypes.STATION_ACTIVITY, info);
                        return dispatch(new StationRepliedAction(statusReply, info.url), { root: true });
                    },
                    (error) => {
                        if (error instanceof QueryThrottledError) {
                            return error;
                        }
                        return Promise.reject(error);
                    }
                );

            await logAnalytics("station_deply");
        },
        [ActionTypes.END_STATION_DEPLOYMENT]: ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");
            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .stopDataRecording(info.url)
                .then(
                    (statusReply) => {
                        commit(MutationTypes.STATION_ACTIVITY, info);
                        return dispatch(new StationRepliedAction(statusReply, info.url), { root: true });
                    },
                    (error) => {
                        if (error instanceof QueryThrottledError) {
                            return error;
                        }
                        return Promise.reject(error);
                    }
                );
        },
        [ActionTypes.SCAN_STATION_MODULES]: ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");
            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .scanModules(info.url)
                .then((statusReply) => {
                    commit(MutationTypes.STATION_ACTIVITY, info);
                    return dispatch(new StationRepliedAction(statusReply, info.url), { root: true });
                });
        },
        [ActionTypes.SCAN_STATION_NETWORKS]: ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");
            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .scanNearbyNetworks(info.url)
                .then(() => {
                    commit(MutationTypes.STATION_ACTIVITY, info);
                });
        },
    };
};

const getters = {
    anyNearbyStations: (state: NearbyState): boolean => {
        return Object.values(state.stations).length > 0;
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: NearbyState) => {
        Object.assign(state, new NearbyState());
    },
    [MutationTypes.FIND]: (state: NearbyState, info: ServiceInfo) => {
        if (!state.stations[info.deviceId]) {
            Vue.set(state.expired, info.deviceId, null);
            Vue.set(state.stations, info.deviceId, new NearbyStation(info));
        }
    },
    [MutationTypes.LOSE]: (state: NearbyState, info: { deviceId: string }) => {
        if (state.stations[info.deviceId]) {
            Vue.set(state.expired, info.deviceId, state.stations[info.deviceId]);
            const clone = { ...state.stations };
            delete clone[info.deviceId];
            state.stations = clone;
        }
    },
    [MutationTypes.STATION_QUERIED]: (state: NearbyState, info: ServiceInfo) => {
        if (state.stations[info.deviceId]) {
            state.stations[info.deviceId].queried = new Date();
        }
    },
    [MutationTypes.STATION_ACTIVITY]: (state: NearbyState, info: ServiceInfo) => {
        if (state.stations[info.deviceId]) {
            state.stations[info.deviceId].activity = new Date();
        }
    },
    [MutationTypes.TRANSFER_OPEN]: (state: NearbyState, payload: OpenProgressMutation) => {
        if (payload.downloading) {
            if (!state.stations[payload.deviceId]) {
                console.log("warning: no nearby station in transfer open", payload.downloading);
                if (state.expired[payload.deviceId]) {
                    Vue.set(state.stations, payload.deviceId, state.expired[payload.deviceId]);
                } else {
                    console.log("warning: no expired station in transfer open");
                }
            }
            if (state.stations[payload.deviceId]) {
                state.stations[payload.deviceId].transferring = true;
                state.stations[payload.deviceId].activity = new Date();
            }
        }
    },
    [MutationTypes.TRANSFER_PROGRESS]: (state: NearbyState, progress: TransferProgress) => {
        if (state.stations[progress.deviceId]) {
            state.stations[progress.deviceId].activity = new Date();
        } else {
            console.log("warning: no nearby station in transfer progress");
        }
    },
    [MutationTypes.TRANSFER_CLOSE]: (state: NearbyState, deviceId: string) => {
        if (state.stations[deviceId]) {
            state.stations[deviceId].transferring = false;
            state.stations[deviceId].activity = new Date();
        } else {
            console.log("warning: no nearby station in transfer close");
        }
    },
    [MutationTypes.PHONE_LOCATION]: (state: NearbyState, location: PhoneLocation) => {
        Vue.set(state, "location", location);
    },
};

export const nearby = (services: ServiceRef): ModuleType => {
    const state = () => new NearbyState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
