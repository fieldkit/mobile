import { PhoneLocation, CommonLocations } from "../types";
import * as MutationTypes from "../mutations";

export class MapState {
    center: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
}

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.PHONE_LOCATION]: (state: MapState, location: PhoneLocation) => {
        if (location != null) {
            state.center = location;
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
