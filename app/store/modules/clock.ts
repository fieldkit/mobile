import * as MutationTypes from "../mutations";

export class ClockState {
    public now: Date = new Date();
}

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.TICK]: (state: ClockState) => {
        state.now = new Date();
    },
};

const state = () => new ClockState();

export const clock = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
