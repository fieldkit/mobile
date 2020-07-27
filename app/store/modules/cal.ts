import _ from "lodash";
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Station } from "../types";
import { Services, ServiceRef } from "./utilities";

export class CalibrationState {
    services: ServiceRef = new ServiceRef();
}

const getters = {};

type ActionParameters = { commit: any; dispatch: any; state: CalibrationState };

const actions = {
    [ActionTypes.STATIONS_LOADED]: ({ commit, dispatch, state }: ActionParameters, stations) => {
        commit(MutationTypes.STATIONS, stations);
    },
    [ActionTypes.STATION_REPLY]: ({ commit, dispatch, state }: ActionParameters, statusReply) => {
        return true;
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: CalibrationState, error: string) => {
        Object.assign(state, new CalibrationState());
    },
    [MutationTypes.SERVICES]: (state: CalibrationState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
    },
    [MutationTypes.STATIONS]: (state: CalibrationState, stations: Station[]) => {
        //
    },
};

const state = () => new CalibrationState();

export const cal = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
