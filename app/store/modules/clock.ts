import * as MutationTypes from "../mutations";

export class Clock {
    public now: Date = new Date();
}

export class ClockState {
    public wall: Clock = new Clock();
}

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.TICK]: (state: ClockState) => {
        state.wall = new Clock();
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
