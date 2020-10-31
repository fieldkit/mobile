import _ from "lodash";
import Vue from "vue";
import { ActionContext } from "vuex";
import { ActionTypes, StationRepliedAction } from "../actions";
import { MutationTypes } from "../mutations";
import { Station, ServiceInfo } from "../types";
import { ServiceRef } from "@/services";
import { GlobalGetters } from "./global";
import { calibrationStrategies, ModuleStatus, AtlasSensorType, StationCalibration, AtlasCalValue } from "@/calibration";
import CalibrationService, { WireAtlasReply } from "@/services/calibration-service";

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
        public readonly sensorType: AtlasSensorType,
        public readonly value: AtlasCalValue,
        public readonly compensations: { temperature: number | null }
    ) {}
}

export class CalibrationState {
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
            .map((station) => {
                return new StationCalibration(station, state.status, calibrationStrategies());
            })
            .keyBy((k) => k.id)
            .value();
    },
};

type ActionParameters = ActionContext<CalibrationState, never>;

const actions = (services: ServiceRef) => {
    return {
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
        [ActionTypes.STATION_REPLY]: ({ commit, dispatch, state }: ActionParameters, payload: StationRepliedAction) => {
            const updating = _.fromPairs(
                payload.statusReply.modules.map((m) => {
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
            const service = new CalibrationService(services.conservify());
            const url = `${info.url}/modules/${payload.position}`;
            return service.clearCalibration(url).then((cleared) => {
                console.log("cal:", "cleared", payload.moduleId, cleared);
                return commit(CLEARED_CALIBRATION, { [payload.moduleId]: cleared });
            });
        },
        [ActionTypes.CALIBRATE_SENSOR]: ({ commit, dispatch, state }: ActionParameters, payload: CalibrateAtlas) => {
            const info = state.connected[payload.deviceId];
            if (!info) throw new Error(`no info for nearby station ${payload.deviceId}`);
            const service = new CalibrationService(services.conservify());
            const url = `${info.url}/modules/${payload.position}`;
            const params = {
                sensorType: payload.sensorType,
                which: payload.value.which,
                reference: payload.value.reference,
                compensations: payload.compensations,
            };
            return service.calibrateSensor(url, params).then((calibrated: WireAtlasReply) => {
                console.log("cal:", "calibrated", payload.moduleId, calibrated);
                return commit(CALIBRATED, { [payload.moduleId]: calibrated });
            });
        },
    };
};

type PossibleCalibrations = WireAtlasReply;

const mutations = {
    [MutationTypes.RESET]: (state: CalibrationState, error: string) => {
        Object.assign(state, new CalibrationState());
    },
    [MutationTypes.FIND]: (state: CalibrationState, info: ServiceInfo) => {
        Vue.set(state.connected, info.deviceId, info);
    },
    [MutationTypes.LOSE]: (state: CalibrationState, info: ServiceInfo) => {
        Vue.set(state.connected, info.deviceId, null);
    },
    [CALIBRATED]: (state: CalibrationState, payload: { [index: string]: PossibleCalibrations }) => {
        Vue.set(state, "status", { ...state.status, ...payload });
    },
    [CLEARED_CALIBRATION]: (state: CalibrationState, payload: { [index: string]: PossibleCalibrations }) => {
        Vue.set(state, "status", { ...state.status, ...payload });
    },
    [CALIBRATION_REFRESH]: (state: CalibrationState, payload: { [index: string]: PossibleCalibrations }) => {
        Vue.set(state, "status", { ...state.status, ...payload });
    },
};

export const cal = (services: ServiceRef) => {
    const state = () => new CalibrationState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
