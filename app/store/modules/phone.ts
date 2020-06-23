import { PhoneLocation, PhoneNetwork } from "../types";
import * as MutationTypes from "../mutations";
// import * as ActionTypes from "../actions";

interface PhoneState {
    network: PhoneNetwork;
    location: PhoneLocation;
}

// Twin Peaks East in Angeles National Forest
const TwinPeaksEastLosAngelesNationlForest: PhoneLocation = {
    latitude: 34.3318104,
    longitude: -118.0730372,
};

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.PHONE_LOCATION]: (state: PhoneState, location: PhoneLocation) => {
        state.location = location;
    },
    [MutationTypes.PHONE_NETWORK]: (state: PhoneState, network: PhoneNetwork) => {
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
