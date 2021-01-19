import { Module } from "vuex";
import { MutationTypes, NavigationMutation } from "../mutations";
import { ServiceRef } from "@/services";

export class NavigationState {
    public frames: { [frame: string]: NavigationMutation } = {};
}

const getters = {};

const actions = (_services: ServiceRef) => {
    return {};
};

const mutations = {
    [MutationTypes.NAVIGATION]: (state: NavigationState, payload: NavigationMutation) => {
        if (payload.frame != "") {
            state.frames[payload.frame] = payload;
        }
    },
};

const state = () => new NavigationState();

type ModuleType = Module<NavigationState, never>;

export const nav = (services: ServiceRef): ModuleType => {
    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
