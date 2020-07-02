import Vue from "../../wrappers/vue";
import AppSettings from "../../wrappers/app-settings";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";

export class NetworkState {
    online: boolean = false;
    authenticated: boolean = false;
    station: boolean = false;
}

type ActionParameters = { commit: any };

const getters = {};

const actions = {
    [ActionTypes.INITIALIZE]: ({ commit }: ActionParameters) => {
        const appSettings = new AppSettings();
        const token = appSettings.getString("accessToken");
        if (token) {
            commit(MutationTypes.LOGIN, token);
        }
    },
    [ActionTypes.AUTHENTICATED]: ({ commit }: ActionParameters, token: string) => {
        commit(MutationTypes.LOGIN, token);
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: NetworkState, error: string) => {
        Object.assign(state, new NetworkState());
    },
    [MutationTypes.LOGIN]: (state: NetworkState, token: string) => {
        Vue.set(state, "authenticated", true);
    },
    [MutationTypes.LOGOUT]: (state: NetworkState) => {
        Vue.set(state, "authenticated", false);
    },
};

const state = () => new NetworkState();

export const network = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
