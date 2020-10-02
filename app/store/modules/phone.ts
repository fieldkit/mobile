import Vue from "vue";
import { CommonLocations, PhoneLocation, PhoneNetwork } from "../types";
import * as MutationTypes from "../mutations";
import { ServiceRef } from "./utilities";

export class PhoneState {
    network: PhoneNetwork = new PhoneNetwork(null);
    location: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
}

const getters = {};

const actions = (services: ServiceRef) => {
    return {};
};

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

export const phone = (services: ServiceRef) => {
    const state = () => new PhoneState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
