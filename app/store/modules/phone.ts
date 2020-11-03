import Vue from "vue";
import { Module } from "vuex";
import { CommonLocations, PhoneLocation, PhoneNetwork } from "../types";
import { MutationTypes } from "../mutations";
import { ServiceRef } from "@/services";

export class PhoneState {
    network: PhoneNetwork = new PhoneNetwork(null);
    location: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
}

const getters = {};

const actions = (_services: ServiceRef) => {
    return {};
};

const mutations = {
    [MutationTypes.RESET]: (state: PhoneState) => {
        Object.assign(state, new PhoneState());
    },
    [MutationTypes.PHONE_LOCATION]: (state: PhoneState, location: PhoneLocation) => {
        Vue.set(state, "location", location);
    },
    [MutationTypes.PHONE_NETWORK]: (state: PhoneState, network: PhoneNetwork) => {
        Vue.set(state, "network", network);
    },
};

type ModuleType = Module<PhoneState, never>;

export const phone = (services: ServiceRef): ModuleType => {
    const state = () => new PhoneState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
