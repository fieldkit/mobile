import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { CommonLocations, PhoneLocation, PhoneNetwork } from "../types";
import { MutationTypes } from "../mutations";
import { ActionTypes, RefreshNetworkAction, NetworkChangedAction } from "../actions";
import { ServiceRef } from "@/services";

export class PhoneState {
    network: PhoneNetwork = new PhoneNetwork(null);
    location: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
}

const getters = {};

type ActionParameters = ActionContext<PhoneState, never>;

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.REFRESH_NETWORK]: async ({ dispatch, commit, state }: ActionParameters, _payload: RefreshNetworkAction) => {
            const status = await services.conservify().findConnectedNetwork();
            const newSsid = status.connectedWifi?.ssid || null;
            if (newSsid != state.network.ssid) {
                const network = new PhoneNetwork(newSsid);
                commit(MutationTypes.PHONE_NETWORK, network);
                await dispatch(new NetworkChangedAction(network));
            }
        },
    };
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
