import * as MutationTypes from "../mutations";
import { RouteState } from "../../routes/navigate";
import { ServiceRef } from "@/services";

export class NavigationState {
    public route: RouteState | null = null;
}

const getters = {};

const actions = (services: ServiceRef) => {
    return {};
};

const mutations = {
    [MutationTypes.NAVIGATION]: (state: NavigationState, route: RouteState) => {
        state.route = route;
    },
};

const state = () => new NavigationState();

export const nav = (services: ServiceRef) => {
    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
