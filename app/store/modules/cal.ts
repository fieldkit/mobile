import _ from "lodash";
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Station, ServiceInfo } from "../types";
import { Services, ServiceRef } from "./utilities";
import CalibrationService from "../../services/calibration-service";

export class ClearAtlasCalibration {
    public readonly type: string = ActionTypes.CLEAR_SENSOR_CALIBRATION;

    constructor(public readonly deviceId: string, public readonly position: number) {}
}

export class CalibrateAtlas {
    public readonly type: string = ActionTypes.CALIBRATE_SENSOR;

    constructor(public readonly deviceId: string, public readonly position: number, public readonly reference: number) {}
}

export class CalibrationState {
    services: ServiceRef = new ServiceRef();
    connected: { [index: string]: ServiceInfo } = {};
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
    [ActionTypes.CALIBRATE_SENSOR]: ({ commit, dispatch, state }: ActionParameters, payload: CalibrateAtlas) => {
        return true;
    },
    [ActionTypes.CLEAR_SENSOR_CALIBRATION]: ({ commit, dispatch, state }: ActionParameters, payload: ClearAtlasCalibration) => {
        console.log("clearing", payload);
        const info = state.connected[payload.deviceId];
        console.log("connected", state.connected, info);
        if (!info) {
            throw new Error(`no info for nearby station ${payload.deviceId}`);
        }
        const service = new CalibrationService(state.services.conservify());
        const url = info.url + "/modules/" + payload.position;
        console.log("INFO", info, url);
        return service.clearCalibration(url);
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: CalibrationState, error: string) => {
        Object.assign(state, new CalibrationState());
    },
    [MutationTypes.FIND]: (state: CalibrationState, info: ServiceInfo) => {
        console.log("cal:find", info);
        Vue.set(state.connected, info.deviceId, info);
    },
    [MutationTypes.LOSE]: (state: CalibrationState, info: ServiceInfo) => {
        console.log("cal:lose", info);
        Vue.set(state.connected, info.deviceId, null);
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
