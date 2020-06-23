import _ from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { QueryThrottledError } from "../../lib/errors";
import { ServiceInfo, NearbyStation, PhoneLocation } from "../types";

export class NearbyState {
    queryStation: () => any | never = () => new Error();
    stations: { [index: string]: NearbyStation } = {};
    location: PhoneLocation = PhoneLocation.TwinPeaksEastLosAngelesNationalForest;
}

const actions = {
    [ActionTypes.FOUND]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: NearbyState }, info: ServiceInfo) => {
        commit(MutationTypes.FIND, info);
        return dispatch(ActionTypes.QUERY_STATION, info);
    },
    [ActionTypes.LOST]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: NearbyState }, info: ServiceInfo) => {
        commit(MutationTypes.LOSE, info);
    },
    [ActionTypes.QUERY_STATION]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: NearbyState }, info: ServiceInfo) => {
        commit(MutationTypes.QUERIED, info);
        return state
            .queryStation()
            .getStatus(info.url)
            .then(
                statusReply => {
                    commit(MutationTypes.TRIED, info);
                    return dispatch(ActionTypes.REPLY, statusReply, { root: true });
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

const getters = {};

const mutations = {
    [MutationTypes.SERVICES]: (state: NearbyState, services: any) => {
        state.queryStation = function () {
            return services().QueryStation();
        };
    },
    [MutationTypes.FIND]: (state: NearbyState, info: ServiceInfo) => {
        state.stations[info.deviceId] = new NearbyStation(info);
    },
    [MutationTypes.LOSE]: (state: NearbyState, info: ServiceInfo) => {
        delete state.stations[info.deviceId];
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
    [MutationTypes.PHONE_LOCATION]: (state: NearbyState, location: PhoneLocation) => {
        state.location = location;
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
