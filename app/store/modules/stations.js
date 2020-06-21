import _ from "lodash";
import ld from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";

const getters = {};

const actions = {
    [ActionTypes.LOAD]: ({ commit, dispatch, state }) => {
        return state
            .db()
            .getAll()
            .then(
                stations => commit(MutationTypes.SET, stations),
                error => commit(MutationTypes.ERROR, error)
            );
    },
    [ActionTypes.REPLY]: ({ commit, dispatch, state }, statusReply) => {
        const station = {
            deviceId: statusReply.status.identity.deviceId,
            generationId: statusReply.status.identity.generationId,
            name: statusReply.status.identity.device,
            serialized: statusReply.serialized,
        };
        return state
            .db()
            .addOrUpdateStation(station)
            .then(
                station =>
                    state
                        .db()
                        .getAll()
                        .then(stations => commit(MutationTypes.SET, stations)),
                error => commit(MutationTypes.ERROR, error.message)
            );
    },
};

const mutations = {
    [MutationTypes.SERVICES]: (state, services) => {
        state.db = function () {
            return services().Database();
        };
    },
    [MutationTypes.SET]: (state, stations) => {
        state.all = _.cloneDeep(stations);
        state.error = false;
    },
    [MutationTypes.ERROR]: (state, error) => {
        state.error = error;
    },
};

const state = () => {
    return {
        db: null,
        error: false,
        all: [],
    };
};

export const stations = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
