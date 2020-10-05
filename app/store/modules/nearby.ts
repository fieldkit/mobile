import _ from "lodash";
import Vue from "vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { QueryThrottledError } from "../../lib/errors";
import { ServiceInfo, NearbyStation, OpenProgressPayload, TransferProgress, PhoneLocation, CommonLocations } from "../types";
import { StationRepliedAction, AddStationNetworkAction, TryStationAction } from "@/store/typed-actions";
import { ServiceRef } from "@/services";

import { backOff } from "exponential-backoff";

export interface Schedule {
    intervals: { start: number; end: number; interval: number }[];
    duration: number;
}

export interface Schedules {
    readings: Schedule;
    network: Schedule;
}

export class NearbyState {
    stations: { [index: string]: NearbyStation } = {};
    expired: { [index: string]: NearbyStation } = {};
    location: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
}

type ActionParameters = { commit: any; dispatch: any; state: NearbyState };

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.SCAN_FOR_STATIONS]: async ({ dispatch, state }: ActionParameters) => {
            await services.discovery().restart();
            const candidates = await services.db().queryRecentlyActiveAddresses();
            console.log("nearby:scan", candidates);
            const offline = candidates;
            const tries = offline.map((candidate) => dispatch(ActionTypes.TRY_STATION_ONCE, new TryStationAction(candidate)));
            return await Promise.all(tries);
        },
        [ActionTypes.REFRESH]: ({ dispatch, state }: ActionParameters) => {
            const now = new Date();
            return Promise.all(
                Object.values(state.stations).map((nearby) => {
                    if (nearby.old(now) || nearby.tooManyFailures()) {
                        console.log("station inactive, losing", nearby.info.deviceId, now.getTime() - nearby.activity.getTime());
                        return dispatch(ActionTypes.LOST, nearby.info);
                    }
                    return {};
                })
            ).then(() => dispatch(ActionTypes.QUERY_NECESSARY));
        },
        [ActionTypes.FOUND]: ({ commit, dispatch, state }: ActionParameters, info: ServiceInfo) => {
            commit(MutationTypes.FIND, info);
            return dispatch(ActionTypes.QUERY_STATION, info);
        },
        [ActionTypes.MAYBE_LOST]: ({ dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            const info = state.stations[payload.deviceId] || state.expired[payload.deviceId];
            if (info && !info.transferring) {
                return dispatch(ActionTypes.QUERY_STATION, info).catch((error) => dispatch(ActionTypes.LOST, payload));
            }
        },
        [ActionTypes.PROBABLY_LOST]: ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string }) => {},
        [ActionTypes.LOST]: ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            const info = state.stations[payload.deviceId]?.info || null;
            commit(MutationTypes.LOSE, payload);
            if (info) {
                dispatch(new TryStationAction(info));
            }
            return;
        },
        [ActionTypes.TRY_STATION_ONCE]: ({ commit, dispatch, state }: ActionParameters, payload: TryStationAction) => {
            if (!payload) throw new Error("payload required");
            if (!payload.info) throw new Error("payload.info required");
            return services
                .queryStation()
                .takeReadings(payload.info.url, state.location)
                .then((statusReply) => {
                    commit(MutationTypes.FIND, payload.info);
                    commit(MutationTypes.STATION_QUERIED, payload.info);
                    commit(MutationTypes.STATION_ACTIVITY, payload.info);
                    return dispatch(new StationRepliedAction(statusReply, payload.info.url), { root: true });
                });
        },
        [ActionTypes.TRY_STATION]: async ({ commit, dispatch, state }: ActionParameters, payload: TryStationAction) => {
            if (!payload) throw new Error("payload required");
            if (!payload.info) throw new Error("payload.info required");
            return await backOff(() => dispatch(ActionTypes.TRY_STATION_ONCE, payload), {
                maxDelay: 60000,
                numOfAttempts: 10,
                startingDelay: 250,
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
                            console.log("query-stationi:warning", error.message);
                            return Promise.resolve();
                        }
                        return Promise.reject(error);
                    }
                );
        },
        [ActionTypes.QUERY_NECESSARY]: ({ commit, dispatch, state }: ActionParameters) => {
            return Promise.all(
                Object.values(state.stations)
                    .filter((nearby: NearbyStation) => {
                        if (nearby.transferring) {
                            console.log("skip nearby transferring station");
                            return false;
                        }
                        const mark = nearby.activity.getTime() > nearby.queried.getTime() ? nearby.activity : nearby.queried;
                        const now = new Date();
                        const elapsed = now.getTime() - mark.getTime();
                        const querying = elapsed > nearby.delay;
                        return querying;
                    })
                    .map((nearby: NearbyStation) =>
                        /*
                    backOff(() => dispatch(ActionTypes.QUERY_STATION, nearby.info), {
                        numOfAttempts: 1,
                        startingDelay: 250,
                    }).catch((error) => {
                        console.log("query-necessary failed", nearby.info);
                        return dispatch(ActionTypes.LOST, nearby.info);
                    })
					*/
                        dispatch(ActionTypes.QUERY_STATION, nearby.info).then(
                            (reply) => nearby.success(),
                            (error) => nearby.failure()
                        )
                    )
            );
        },
        [ActionTypes.QUERY_ALL]: ({ commit, dispatch, state }: ActionParameters) => {
            return Promise.all(Object.values(state.stations).map((station) => dispatch(ActionTypes.QUERY_STATION, station.info)));
        },
        [ActionTypes.RENAME_STATION]: ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string; name: string }) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");

            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .configureName(info.url, payload.name)
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
        [ActionTypes.CONFIGURE_STATION_NETWORK]: ({ commit, dispatch, state }: ActionParameters, payload: AddStationNetworkAction) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");

            const networks = [
                {
                    ssid: payload.ssid,
                    password: payload.password,
                },
            ];

            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .sendNetworkSettings(info.url, networks)
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
            payload: { deviceId: string; schedules: Schedules }
        ) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");

            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .configureSchedule(info.url, payload.schedules)
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
        [ActionTypes.DEPLOY_STATION]: ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");
            commit(MutationTypes.STATION_QUERIED, info);
            return services
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
        [ActionTypes.SCAN_STATION_NETWORKS]: ({ commit, dispatch, state }: ActionParameters, payload: { deviceId: string }) => {
            if (!payload?.deviceId) throw new Error("no nearby info");
            const info = state.stations[payload.deviceId];
            if (!info) throw new Error("no nearby info");
            commit(MutationTypes.STATION_QUERIED, info);
            return services
                .queryStation()
                .scanNearbyNetworks(info.url)
                .then((networksReply) => {
                    commit(MutationTypes.STATION_ACTIVITY, info);
                    return networksReply;
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
    [MutationTypes.RESET]: (state: NearbyState, error: string) => {
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
    [MutationTypes.TRANSFER_OPEN]: (state: NearbyState, payload: OpenProgressPayload) => {
        if (payload.downloading) {
            if (!state.stations[payload.deviceId]) {
                console.log("warning: no nearby station in transfer open");
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

export const nearby = (services: ServiceRef) => {
    const state = () => new NearbyState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
