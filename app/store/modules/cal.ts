import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { debug } from "@/lib";
import { ActionTypes, StationRepliedAction } from "../actions";
import { MutationTypes } from "../mutations";
import { Station, ServiceInfo } from "../types";
import { ServiceRef } from "@/services";
import { CalibrationState, GlobalGetters } from "./global";
import {
    calibrationStrategies,
    PendingCalibrationPoint,
    PendingCalibration,
    StationCalibration,
    WaterCalValue,
    getCurveForSensor,
} from "@/calibration";
import { fk_data as DataProto } from "fk-data-protocol/fk-data";
import CalibrationService from "@/services/calibration-service";
import { Buffer } from "buffer";

type ActionParameters = ActionContext<CalibrationState, never>;

type ModuleType = Module<CalibrationState, never>;

type ModuleConfiguration = DataProto.ModuleConfiguration;

export type CurveType = DataProto.CurveType;

export class ClearWaterCalibration {
    public readonly type: string = ActionTypes.CLEAR_SENSOR_CALIBRATION;

    constructor(public readonly deviceId: string, public readonly moduleId: string, public readonly position: number) {}
}

export class CalibrateWater {
    public readonly type: string = ActionTypes.CALIBRATE_SENSOR;

    constructor(
        public readonly deviceId: string,
        public readonly moduleId: string,
        public readonly position: number,
        public readonly value: WaterCalValue,
        public readonly compensations: { temperature: number | null },
        public readonly expectedPoints: number,
        public readonly curveType: CurveType,
        public readonly uncalibrated: number,
        public readonly factory: number
    ) {}
}

export class CalibrateBegin {
    public readonly type: string = ActionTypes.CALIBRATE_BEGIN;

    constructor(public readonly deviceId: string, public readonly moduleId: string, public readonly position: number) {}
}

const getters = {
    stationCalibrations: (
        state: CalibrationState,
        _getters: never,
        _rootState: never,
        rootGetters: GlobalGetters
    ): { [index: number]: StationCalibration } => {
        return _(rootGetters.legacyStations)
            .map((station) => new StationCalibration(station, state.configurations, calibrationStrategies()))
            .keyBy((k) => k.id)
            .value();
    },
};

function updateConfiguration(older: ModuleConfiguration | null | undefined, newer: ModuleConfiguration | null | undefined): boolean {
    if (!newer) return false;
    if (!older) return true;

    // This doesn't work and I have no idea why.
    /*
    if (_.isEqual(_.toPlainObject(older), _.toPlainObject(newer))) {
        return false;
    }
	*/

    // Plan B!
    if (JSON.stringify(older) == JSON.stringify(newer)) {
        return false;
    }

    return true;
}

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.STATIONS_LOADED]: ({ commit, dispatch, state }: ActionParameters, stations: Station[]) => {
            const modules = _.flatten(stations.map((station) => station.modules));
            return modules.map((m) => {
                if (updateConfiguration(state.configurations[m.moduleId], m.configuration)) {
                    commit(MutationTypes.MODULE_CONFIGURATION, { moduleId: m.moduleId, configuration: m.configuration });
                }
            });
        },
        [ActionTypes.STATION_REPLY]: ({ commit, dispatch, state }: ActionParameters, payload: StationRepliedAction) => {
            return payload.statusReply.modules.map((m) => {
                if (updateConfiguration(state.configurations[m.moduleId], m.configuration)) {
                    commit(MutationTypes.MODULE_CONFIGURATION, { moduleId: m.moduleId, configuration: m.configuration });
                }
            });
        },
        [ActionTypes.CLEAR_SENSOR_CALIBRATION]: async ({ commit, dispatch, state }: ActionParameters, payload: ClearWaterCalibration) => {
            const info = state.connected[payload.deviceId];
            if (!info) throw new Error(`no info for nearby station ${payload.deviceId}`);
            const service = new CalibrationService(services.queryStation(), services.conservify());
            const url = `${info.url}/modules/${payload.position}`;
            return await service.clearCalibration(url).then((cleared) => {
                debug.log("cal:", "cleared", payload.moduleId, cleared);
                return commit(MutationTypes.CLEARED_CALIBRATION, { moduleId: payload.moduleId, configuration: cleared });
            });
        },
        [ActionTypes.CALIBRATE_BEGIN]: ({ commit, dispatch, state }: ActionParameters, payload: CalibrateBegin) => {
            return commit(MutationTypes.CALIBRATION_BEGIN, { moduleId: payload.moduleId });
        },
        [ActionTypes.CALIBRATE_SENSOR]: async ({ commit, dispatch, state }: ActionParameters, payload: CalibrateWater) => {
            const moduleId = payload.moduleId;
            const info = state.connected[payload.deviceId];
            if (!info) throw new Error(`no info for nearby station ${payload.deviceId}`);
            const values = [payload.uncalibrated];
            debug.log(`values: ${JSON.stringify(values)}`);
            const pcp = new PendingCalibrationPoint(payload.value.index, [payload.value.reference], values, [payload.factory]);
            commit(MutationTypes.CALIBRATION_POINT, { moduleId: moduleId, point: pcp });

            const pending = state.pending[moduleId];
            const completed = pending.points.length == payload.expectedPoints;
            if (completed) {
                try {
                    const curve = getCurveForSensor(payload.curveType);
                    const calibration = curve.calculate(pending);
                    debug.log(`cal-done: ${JSON.stringify(calibration)}`);

                    const config = DataProto.ModuleConfiguration.create({
                        calibration: calibration,
                    });

                    const encoded = Buffer.from(DataProto.ModuleConfiguration.encodeDelimited(config).finish());
                    const hex = encoded.toString("hex");
                    debug.log(`cal-hex`, encoded.length, hex);

                    const service = new CalibrationService(services.queryStation(), services.conservify());
                    const url = `${info.url}/modules/${payload.position}`;
                    const reply = await service.calibrate(url, encoded);

                    commit(MutationTypes.MODULE_CONFIGURATION, { moduleId: moduleId, configuration: reply });
                } catch (error) {
                    debug.log(`calibration failed:`, error);
                    throw error;
                }
            }
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: CalibrationState) => {
        Object.assign(state, new CalibrationState());
    },
    [MutationTypes.FIND]: (state: CalibrationState, info: ServiceInfo) => {
        Vue.set(state.connected, info.deviceId, info);
    },
    [MutationTypes.LOSE]: (state: CalibrationState, info: ServiceInfo) => {
        Vue.set(state.connected, info.deviceId, null);
    },
    [MutationTypes.MODULE_CONFIGURATION]: (state: CalibrationState, payload: { moduleId: string; configuration: ModuleConfiguration }) => {
        Vue.set(state.configurations, payload.moduleId, payload.configuration);
    },
    [MutationTypes.CALIBRATION_BEGIN]: (state: CalibrationState, payload: { moduleId: string }) => {
        Vue.set(state.pending, payload.moduleId, new PendingCalibration(payload.moduleId));
    },
    [MutationTypes.CLEARED_CALIBRATION]: (state: CalibrationState, payload: { moduleId: string; configuration: ModuleConfiguration }) => {
        Vue.set(state.configurations, payload.moduleId, payload.configuration);
        Vue.set(state.pending, payload.moduleId, new PendingCalibration(payload.moduleId));
    },
    [MutationTypes.CALIBRATION_POINT]: (state: CalibrationState, payload: { moduleId: string; point: PendingCalibrationPoint }) => {
        const previous = state.pending[payload.moduleId] || new PendingCalibration(payload.moduleId);
        const updated = previous.append(payload.point);
        Vue.set(state.pending, payload.moduleId, updated);
        debug.log(`cal-updated: ${JSON.stringify(updated)}`);
    },
};

export const cal = (services: ServiceRef): ModuleType => {
    const state = () => new CalibrationState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
