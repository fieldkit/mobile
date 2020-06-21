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
};

const state = () => {
    return {
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
