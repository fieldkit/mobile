import _ from "lodash";
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { QueryThrottledError } from "../../lib/errors";
import { ServiceInfo, NearbyStation, OpenProgressPayload, TransferProgress, PhoneLocation, CommonLocations } from "../types";
import { Services, ServiceRef } from "./utilities";

export class NearbyState {
    services: ServiceRef = new ServiceRef();
    stations: { [index: string]: NearbyStation } = {};
    location: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
}

type ActionParameters = { commit: any; dispatch: any; state: NearbyState };

const actions = {
    [ActionTypes.REFRESH]: ({ commit, dispatch, state }: ActionParameters) => {
        const now = new Date();
        return Promise.all(
            Object.values(state.stations).map((nearby) => {
                if (nearby.old(now)) {
                    console.log("station inactive, losing", nearby.info.deviceId, now, nearby.activity);
                    return dispatch(ActionTypes.LOST, nearby.info);
                }
                return {};
            })
        ).then(() => {
            return dispatch(ActionTypes.QUERY_NECESSARY);
        });
    },
    [ActionTypes.FOUND]: ({ commit, dispatch, state }: ActionParameters, info: ServiceInfo) => {
        commit(MutationTypes.FIND, info);
        return dispatch(ActionTypes.QUERY_STATION, info);
    },
    [ActionTypes.LOST]: ({ commit, dispatch, state }: ActionParameters, info: ServiceInfo) => {
        commit(MutationTypes.LOSE, info);
        return state.services.legacy().refresh();
    },
    [ActionTypes.QUERY_STATION]: ({ commit, dispatch, state }: ActionParameters, info: ServiceInfo) => {
        commit(MutationTypes.STATION_QUERIED, info);
        return state.services
            .queryStation()
            .takeReadings(info.url, state.location)
            .then(
                (statusReply) => {
                    commit(MutationTypes.STATION_ACTIVITY, info);
                    return dispatch(ActionTypes.STATION_REPLY, statusReply, { root: true });
                },
                (error) => {
                    if (error instanceof QueryThrottledError) {
                        return error;
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
                    const now = new Date();
                    const elapsed = now.getTime() - nearby.activity.getTime();
                    const querying = elapsed > 10 * 1000;
                    return querying;
                })
                .map((nearby: NearbyStation) => dispatch(ActionTypes.QUERY_STATION, nearby.info))
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
        return state.services
            .queryStation()
            .configureName(info.url, payload.name)
            .then(
                (statusReply) => {
                    commit(MutationTypes.STATION_ACTIVITY, info);
                    return dispatch(ActionTypes.STATION_REPLY, statusReply, { root: true });
                },
                (error) => {
                    if (error instanceof QueryThrottledError) {
                        return error;
                    }
                    return Promise.reject(error);
                }
            );
    },
    [ActionTypes.CONFIGURE_STATION_NETWORK]: ({ commit, dispatch, state }: ActionParameters, payload: any) => {
        if (!payload?.deviceId) throw new Error("no nearby info");
        const info = state.stations[payload.deviceId];
        if (!info) throw new Error("no nearby info");
        commit(MutationTypes.STATION_QUERIED, info);
        return state.services
            .queryStation()
            .sendNetworkSettings(info.url, payload.networks)
            .then(
                (statusReply) => {
                    commit(MutationTypes.STATION_ACTIVITY, info);
                    return dispatch(ActionTypes.STATION_REPLY, statusReply, { root: true });
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
        payload: { deviceId: string; schedule: { interval: number } }
    ) => {
        if (!payload?.deviceId) throw new Error("no nearby info");
        const info = state.stations[payload.deviceId];
        if (!info) throw new Error("no nearby info");
        commit(MutationTypes.STATION_QUERIED, info);
        return state.services
            .queryStation()
            .configureSchedule(info.url, { readings: { interval: payload.schedule.interval } })
            .then(
                (statusReply) => {
                    commit(MutationTypes.STATION_ACTIVITY, info);
                    return dispatch(ActionTypes.STATION_REPLY, statusReply, { root: true });
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
        return state.services
            .queryStation()
            .startDataRecording(info.url)
            .then(
                (statusReply) => {
                    commit(MutationTypes.STATION_ACTIVITY, info);
                    return dispatch(ActionTypes.STATION_REPLY, statusReply, { root: true });
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
        return state.services
            .queryStation()
            .stopDataRecording(info.url)
            .then(
                (statusReply) => {
                    commit(MutationTypes.STATION_ACTIVITY, info);
                    return dispatch(ActionTypes.STATION_REPLY, statusReply, { root: true });
                },
                (error) => {
                    if (error instanceof QueryThrottledError) {
                        return error;
                    }
                    return Promise.reject(error);
                }
            );
    },
};

const getters = {
    anyNearbyStations: (state: NearbyState): boolean => {
        return Object.values(state.stations).length > 0;
    },
    numberOfNearbyStations: (state: NearbyState): number => {
        return Object.values(state.stations).length;
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: NearbyState, error: string) => {
        Object.assign(state, new NearbyState());
    },
    [MutationTypes.SERVICES]: (state: NearbyState, services: () => Services) => {
        state.services = new ServiceRef(services);
    },
    [MutationTypes.FIND]: (state: NearbyState, info: ServiceInfo) => {
        if (!state.stations[info.deviceId]) {
            Vue.set(state.stations, info.deviceId, new NearbyStation(info));
        }
    },
    [MutationTypes.LOSE]: (state: NearbyState, info: ServiceInfo) => {
        if (state.stations[info.deviceId]) {
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
            if (state.stations[payload.deviceId]) {
                state.stations[payload.deviceId].transferring = true;
                state.stations[payload.deviceId].activity = new Date();
            }
        }
    },
    [MutationTypes.TRANSFER_PROGRESS]: (state: NearbyState, progress: TransferProgress) => {
        if (state.stations[progress.deviceId]) {
            state.stations[progress.deviceId].activity = new Date();
        }
    },
    [MutationTypes.TRANSFER_CLOSE]: (state: NearbyState, deviceId: string) => {
        if (state.stations[deviceId]) {
            state.stations[deviceId].transferring = false;
            state.stations[deviceId].activity = new Date();
        }
    },
    [MutationTypes.PHONE_LOCATION]: (state: NearbyState, location: PhoneLocation) => {
        Vue.set(state, "location", location);
    },
};

const state = () => new NearbyState();

export const nearby = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
