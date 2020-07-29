import _ from "lodash";
import Vue from "vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Station, ServiceInfo } from "../types";
import { HttpStatusReply } from "../http_reply";
import { Services, ServiceRef } from "./utilities";
import CalibrationService from "@/services/calibration-service";

import { GlobalGetters } from "./global";

import { ModuleStatus, StationCalibration } from "@/calibration/model";
import calibrationStrategies from "@/calibration/strategies";

export const CALIBRATED = "CALIBRATED";
export const CLEARED_CALIBRATION = "CLEARED_CALIBRATION";
export const CALIBRATION_REFRESH = "CALIBRATION_REFRESH";

export class ClearAtlasCalibration {
    public readonly type: string = ActionTypes.CLEAR_SENSOR_CALIBRATION;

    constructor(public readonly deviceId: string, public readonly moduleId: string, public readonly position: number) {}
}

export class CalibrateAtlas {
    public readonly type: string = ActionTypes.CALIBRATE_SENSOR;

    constructor(
        public readonly deviceId: string,
        public readonly moduleId: string,
        public readonly position: number,
        public readonly value: { which: number; reference: number },
        public readonly compensations: { [index: string]: number }
    ) {}
}

export class CalibrationState {
    services: ServiceRef = new ServiceRef();
    status: { [index: string]: ModuleStatus } = {};
    connected: { [index: string]: ServiceInfo } = {};
}

const getters = {
    stationCalibrations: (
        state: CalibrationState,
        getters: never,
        rootState: never,
        rootGetters: GlobalGetters
    ): { [index: number]: StationCalibration } => {
        return _(rootGetters.legacyStations)
            .map((station, key) => {
                return new StationCalibration(station, state.status, calibrationStrategies());
            })
            .keyBy((k) => k.id)
            .value();
    },
};

type ActionParameters = { commit: any; dispatch: any; state: CalibrationState };

const actions = {
    [ActionTypes.STATIONS_LOADED]: ({ commit, dispatch, state }: ActionParameters, stations: Station[]) => {
        const updating = _.fromPairs(
            _.flatten(
                stations.map((station) =>
                    station.modules.map((m) => {
                        if (m.status) {
                            return [m.moduleId, m.status];
                        }
                        return [];
                    })
                )
            )
        );

        return commit(CALIBRATION_REFRESH, updating);
    },
    [ActionTypes.STATION_REPLY]: ({ commit, dispatch, state }: ActionParameters, statusReply: HttpStatusReply) => {
        const updating = _.fromPairs(
            statusReply.modules.map((m) => {
                if (m.status) {
                    return [m.deviceId, m.status];
                }
                return [];
            })
        );

        return commit(CALIBRATION_REFRESH, updating);
    },
    [ActionTypes.CLEAR_SENSOR_CALIBRATION]: ({ commit, dispatch, state }: ActionParameters, payload: ClearAtlasCalibration) => {
        const info = state.connected[payload.deviceId];
        if (!info) {
            throw new Error(`no info for nearby station ${payload.deviceId}`);
        }
        const service = new CalibrationService(state.services.conservify());
        const url = info.url + "/modules/" + payload.position;
        return service.clearCalibration(url).then((cleared) => {
            console.log("cal:", "cleared", payload.moduleId, cleared);
            return commit(CLEARED_CALIBRATION, { [payload.moduleId]: cleared });
        });
    },
    [ActionTypes.CALIBRATE_SENSOR]: ({ commit, dispatch, state }: ActionParameters, payload: CalibrateAtlas) => {
        const info = state.connected[payload.deviceId];
        if (!info) {
            throw new Error(`no info for nearby station ${payload.deviceId}`);
        }
        const service = new CalibrationService(state.services.conservify());
        const url = info.url + "/modules/" + payload.position;
        const params = {
            which: payload.value.which,
            reference: payload.value.reference,
            compensations: payload.compensations,
        };
        return service.calibrateSensor(url, params).then((calibrated) => {
            console.log("cal:", "calibrated", payload.moduleId, calibrated);
            return commit(CALIBRATED, { [payload.moduleId]: calibrated });
        });
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: CalibrationState, error: string) => {
        Object.assign(state, new CalibrationState());
    },
    [MutationTypes.FIND]: (state: CalibrationState, info: ServiceInfo) => {
        // console.log("cal:find", info);
        Vue.set(state.connected, info.deviceId, info);
    },
    [MutationTypes.LOSE]: (state: CalibrationState, info: ServiceInfo) => {
        // console.log("cal:lose", info);
        Vue.set(state.connected, info.deviceId, null);
    },
    [MutationTypes.SERVICES]: (state: CalibrationState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
    },
    [CALIBRATED]: (state: CalibrationState, payload: { [index: string]: object | any }) => {
        Vue.set(state, "status", { ...state.status, ...payload });
    },
    [CLEARED_CALIBRATION]: (state: CalibrationState, payload: { [index: string]: object | any }) => {
        Vue.set(state, "status", { ...state.status, ...payload });
    },
    [CALIBRATION_REFRESH]: (state: CalibrationState, payload: { [index: string]: object | any }) => {
        Vue.set(state, "status", { ...state.status, ...payload });
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
