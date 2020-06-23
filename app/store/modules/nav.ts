import * as MutationTypes from "../mutations";
import { RouteState } from "../../routes/navigate";

class NavigationState {
    public route: RouteState | null = null;
}

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.NAVIGATION]: (state: NavigationState, route: RouteState) => {
        state.route = route;
    },
};

const state = () => new NavigationState();

export const nav = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
