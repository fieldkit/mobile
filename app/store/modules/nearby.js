import _ from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { QueryThrottledError } from "../../lib/errors";

const actions = {
    [ActionTypes.FOUND]: ({ commit, dispatch, state }, info) => {
        commit(MutationTypes.FIND, info);
        return dispatch(ActionTypes.QUERY_STATION, info);
    },
    [ActionTypes.LOST]: ({ commit, dispatch, state }, info) => {
        commit(MutationTypes.LOSE, info);
    },
    [ActionTypes.QUERY_STATION]: ({ commit, dispatch, state }, info) => {
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
    [ActionTypes.QUERY_NECESSARY]: ({ commit, dispatch, state }) => {
        return Promise.all(
            Object.values(state.addresses)
                .filter(info => {
                    const lastTry = state.tried[info.deviceId];
                    if (!lastTry) {
                        return true;
                    }
                    const now = new Date();
                    const elapsed = Number(now - lastTry);
                    return elapsed > 10;
                })
                .map(info => dispatch(ActionTypes.QUERY_STATION, info))
        );
    },
    [ActionTypes.QUERY_ALL]: ({ dispatch, state }) => {
        return Promise.all(Object.values(state.addresses).map(info => dispatch(ActionTypes.QUERY_STATION, info)));
    },
};

const getters = {};

const mutations = {
    [MutationTypes.SERVICES]: (state, services) => {
        state.queryStation = function () {
            return services().QueryStation();
        };
    },
    [MutationTypes.FIND]: (state, serviceInfo) => {
        state.addresses[serviceInfo.deviceId] = _.extend({}, serviceInfo, { added: new Date() });
    },
    [MutationTypes.LOSE]: (state, serviceInfo) => {
        delete state.addresses[serviceInfo.deviceId];
        delete state.queried[serviceInfo.deviceId];
        delete state.tried[serviceInfo.deviceId];
    },
    [MutationTypes.QUERIED]: (state, serviceInfo) => {
        state.queried[serviceInfo.deviceId] = new Date();
    },
    [MutationTypes.TRIED]: (state, serviceInfo) => {
        state.tried[serviceInfo.deviceId] = new Date();
    },
};

const state = () => {
    return {
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
