import { Module } from "vuex";
import { MutationTypes, KeyboardMutation, NavigationMutation } from "../mutations";
import { ServiceRef } from "@/services";

export class NavigationState {
    public frames: { [frame: string]: NavigationMutation } = {};
    public keyboard: { visible: boolean } = { visible: false };
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
    [MutationTypes.NAVIGATION_KEYBOARD]: (state: NavigationState, payload: KeyboardMutation) => {
        state.keyboard.visible = payload.visible;
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
