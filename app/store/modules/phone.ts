import Vue from "vue";
import { CommonLocations, PhoneLocation, PhoneNetwork } from "../types";
import * as MutationTypes from "../mutations";

export class PhoneState {
    network: PhoneNetwork = new PhoneNetwork(null);
    location: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
}

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.RESET]: (state: PhoneState, error: string) => {
        Object.assign(state, new PhoneState());
    },
    [MutationTypes.PHONE_LOCATION]: (state: PhoneState, location: PhoneLocation) => {
        Vue.set(state, "location", location);
    },
    [MutationTypes.PHONE_NETWORK]: (state: PhoneState, network: PhoneNetwork) => {
        Vue.set(state, "network", network);
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
