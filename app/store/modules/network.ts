// import * as MutationTypes from "../mutations";
// import * as ActionTypes from "../actions";

export class NetworkState {
    online: boolean = false;
    authenticated: boolean = false;
    station: boolean = false;
}

const getters = {};

const actions = {};

const mutations = {};

const state = () => new NetworkState();

export const network = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
