import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";

// Twin Peaks East in Angeles National Forest
const TwinPeaksEastLosAngelesNationlForest = {
    latitude: 34.3318104,
    longitude: -118.0730372,
};

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.PHONE_LOCATION]: (state, location) => {
        state.location = location;
    },
    [MutationTypes.PHONE_NETWORK]: (state, network) => {
        state.network = network;
    },
};

const state = () => {
    return {
        network: null,
        location: TwinPeaksEastLosAngelesNationlForest,
    };
};

export const phone = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
