import { PhoneLocation } from "../types";
import * as MutationTypes from "../mutations";

export class MapState {
    location: PhoneLocation = PhoneLocation.TwinPeaksEastLosAngelesNationalForest;
}

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.PHONE_LOCATION]: (state: MapState, location: PhoneLocation) => {
        if (location != null) {
            console.log("LOCATION", location);
            state.location = location;
        }
    },
};

const state = () => new MapState();

export const map = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
