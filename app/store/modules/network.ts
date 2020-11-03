import Vue from "vue";
import { ActionContext, Module } from "vuex";
import AppSettings from "../../wrappers/app-settings";
import { ActionTypes } from "../actions";
import { MutationTypes } from "../mutations";
import { ServiceRef } from "@/services";

export class NetworkState {
    online = false;
    authenticated = false;
    station = false;
}

type ActionParameters = ActionContext<NetworkState, never>;

const getters = {};

const actions = (_services: ServiceRef) => {
    return {
        [ActionTypes.INITIALIZE]: ({ commit }: ActionParameters) => {
            const appSettings = new AppSettings();
            const token = appSettings.getString("accessToken");
            if (token) {
                commit(MutationTypes.LOGIN, token);
            }
        },
        [ActionTypes.AUTHENTICATED]: ({ commit }: ActionParameters) => {
            commit(MutationTypes.LOGIN);
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: NetworkState) => {
        Object.assign(state, new NetworkState());
    },
    [MutationTypes.LOGIN]: (state: NetworkState) => {
        Vue.set(state, "authenticated", true);
    },
    [MutationTypes.LOGOUT]: (state: NetworkState) => {
        Vue.set(state, "authenticated", false);
    },
};

type ModuleType = Module<NetworkState, never>;

export const network = (services: ServiceRef): ModuleType => {
    const state = () => new NetworkState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
