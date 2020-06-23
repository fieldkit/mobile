import { PhoneLocation, PhoneNetwork } from "../types";
import * as MutationTypes from "../mutations";
// import * as ActionTypes from "../actions";

export class PhoneState {
    network: PhoneNetwork = new PhoneNetwork();
    location: PhoneLocation = PhoneLocation.TwinPeaksEastLosAngelesNationalForest;
}

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.PHONE_LOCATION]: (state: PhoneState, location: PhoneLocation) => {
        // state.location = location;
    },
    [MutationTypes.PHONE_NETWORK]: (state: PhoneState, network: PhoneNetwork) => {
        state.network = network;
    },
};

const state = () => new PhoneState();

export const phone = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
