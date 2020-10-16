import * as MutationTypes from "../mutations";
import { RouteState } from "../../routes/navigate";
import { ServiceRef } from "@/services";

export interface Navigation {
    name: string;
    routeState: RouteState;
}

export class NavigationState {
    public route: Navigation | null = null;
}

const getters = {};

const actions = (services: ServiceRef) => {
    return {};
};

const mutations = {
    [MutationTypes.NAVIGATION]: (state: NavigationState, route: Navigation) => {
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
