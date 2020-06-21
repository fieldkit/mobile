import _ from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { QueryThrottledError } from "../../lib/errors";

interface NearbyState {
    queryStation: any;
    addresses: any;
    queried: any;
    tried: any;
}

interface ServiceInfo {
    deviceId: string;
    url: string;
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
            Object.values(state.addresses)
                .filter((info: ServiceInfo) => {
                    const lastTry = state.tried[info.deviceId];
                    if (!lastTry) {
                        return true;
                    }
                    const now = new Date();
                    const elapsed = now.getTime() - lastTry.getTime();
                    return elapsed > 10;
                })
                .map((info: ServiceInfo) => dispatch(ActionTypes.QUERY_STATION, info))
        );
    },
    [ActionTypes.QUERY_ALL]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: NearbyState }) => {
        return Promise.all(Object.values(state.addresses).map(info => dispatch(ActionTypes.QUERY_STATION, info)));
    },
};

const getters = {};

const mutations = {
    [MutationTypes.SERVICES]: (state: NearbyState, services: any) => {
        state.queryStation = function () {
            return services().QueryStation();
        };
    },
    [MutationTypes.FIND]: (state: NearbyState, serviceInfo: ServiceInfo) => {
        state.addresses[serviceInfo.deviceId] = _.extend({}, serviceInfo, { added: new Date() });
    },
    [MutationTypes.LOSE]: (state: NearbyState, serviceInfo: ServiceInfo) => {
        delete state.addresses[serviceInfo.deviceId];
        delete state.queried[serviceInfo.deviceId];
        delete state.tried[serviceInfo.deviceId];
    },
    [MutationTypes.QUERIED]: (state: NearbyState, serviceInfo: ServiceInfo) => {
        state.queried[serviceInfo.deviceId] = new Date();
    },
    [MutationTypes.TRIED]: (state: NearbyState, serviceInfo: ServiceInfo) => {
        state.tried[serviceInfo.deviceId] = new Date();
    },
};

const state = () => {
    return {
        queryStation: null,
        addresses: {},
        queried: {},
        tried: {},
    };
};

export const nearby = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
