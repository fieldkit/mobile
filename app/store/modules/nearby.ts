import _ from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { QueryThrottledError } from "../../lib/errors";
import { ServiceInfo, NearbyStation } from "../types";
import { Services, ServiceRef } from "./utilities";
import { RouteState } from "../../routes/navigate";

export class NearbyState {
    services: ServiceRef = new ServiceRef();
    stations: { [index: string]: NearbyStation } = {};
    readings: { [index: number]: boolean } = {};
}

const actions = {
    [ActionTypes.FOUND]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: NearbyState }, info: ServiceInfo) => {
        commit(MutationTypes.FIND, info);
        return dispatch(ActionTypes.QUERY_STATION, info);
    },
    [ActionTypes.LOST]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: NearbyState }, info: ServiceInfo) => {
        commit(MutationTypes.LOSE, info);
        return state.services.legacy().refresh();
    },
    [ActionTypes.QUERY_STATION]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: NearbyState }, info: ServiceInfo) => {
        commit(MutationTypes.QUERIED, info);
        return state.services
            .queryStation()
            .takeReadings(info.url)
            .then(
                statusReply => {
                    commit(MutationTypes.TRIED, info);
                    return dispatch(ActionTypes.STATION_REPLY, statusReply, { root: true });
                },
                error => {
                    if (error instanceof QueryThrottledError) {
                        return error;
                    }
                    commit(MutationTypes.TRIED, info);
                    return Promise.reject(error);
                }
            );
    },
    [ActionTypes.QUERY_NECESSARY]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: NearbyState }) => {
        return Promise.all(
            Object.values(state.stations)
                .filter((station: NearbyStation) => {
                    if (!station.tried) {
                        return true;
                    }
                    const now = new Date();
                    const elapsed = now.getTime() - station.tried.getTime();
                    const querying = elapsed > 10 * 1000;
                    return querying;
                })
                .map((station: NearbyStation) => dispatch(ActionTypes.QUERY_STATION, station.info))
        );
    },
    [ActionTypes.QUERY_ALL]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: NearbyState }) => {
        return Promise.all(Object.values(state.stations).map(station => dispatch(ActionTypes.QUERY_STATION, station.info)));
    },
    [ActionTypes.REFRESH]: ({ commit, dispatch }: { commit: any; dispatch: any }) => {
        return dispatch(ActionTypes.QUERY_NECESSARY);
    },
};

const getters = {
    anyNearbyStations: (state: NearbyState): boolean => {
        return Object.values(state.stations).length > 0;
    },
};

const mutations = {
    [MutationTypes.SERVICES]: (state: NearbyState, services: () => Services) => {
        state.services = new ServiceRef(services);
    },
    [MutationTypes.FIND]: (state: NearbyState, info: ServiceInfo) => {
        if (!state.stations[info.deviceId]) {
            state.stations = { ...state.stations, [info.deviceId]: new NearbyStation(info) };
        }
    },
    [MutationTypes.LOSE]: (state: NearbyState, info: ServiceInfo) => {
        if (state.stations[info.deviceId]) {
            const clone = { ...state.stations };
            delete clone[info.deviceId];
            state.stations = clone;
        }
    },
    [MutationTypes.QUERIED]: (state: NearbyState, info: ServiceInfo) => {
        if (state.stations[info.deviceId]) {
            state.stations[info.deviceId].queried = new Date();
        }
    },
    [MutationTypes.TRIED]: (state: NearbyState, info: ServiceInfo) => {
        if (state.stations[info.deviceId]) {
            state.stations[info.deviceId].tried = new Date();
        }
    },
    [MutationTypes.NAVIGATION]: (state: NearbyState, route: RouteState) => {
        const id = route?.props?.stationId;
        if (id) {
            state.readings = { ...state.readings, [id]: true };
        } else {
            state.readings = {};
        }
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
