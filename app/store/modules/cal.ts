import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { ActionTypes, StationRepliedAction } from "../actions";
import { MutationTypes } from "../mutations";
import { Station, ServiceInfo, ModuleStatus } from "../types";
import { ServiceRef } from "@/services";
import { CalibrationState, PendingCalibration, PendingCalibrationPoint, GlobalGetters } from "./global";
import { calibrationStrategies, StationCalibration, AtlasCalValue } from "@/calibration";
import { fk_data as DataProto } from "fk-data-protocol/fk-data";
import CalibrationService, { WireAtlasReply } from "@/services/calibration-service";
import { unixNow } from "@/utilities";

type PossibleCalibrations = WireAtlasReply;

export class ClearAtlasCalibration {
    public readonly type: string = ActionTypes.CLEAR_SENSOR_CALIBRATION;

    constructor(public readonly deviceId: string, public readonly moduleId: string, public readonly position: number) {}
}

type ActionParameters = ActionContext<CalibrationState, never>;

type ModuleType = Module<CalibrationState, never>;

export class CalibrateAtlas {
    public readonly type: string = ActionTypes.CALIBRATE_SENSOR;

    constructor(
        public readonly deviceId: string,
        public readonly moduleId: string,
        public readonly position: number,
        public readonly value: AtlasCalValue,
        public readonly compensations: { temperature: number | null },
        public readonly expectedPoints: number
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
            .map((station) => {
                return new StationCalibration(station, state.status, calibrationStrategies());
            })
            .keyBy((k) => k.id)
            .value();
    },
};

export abstract class CalibrationCurve {
    public abstract calculate(pending: PendingCalibration): DataProto.Calibration;
    public abstract calculateCoefficients(pending: PendingCalibration): DataProto.CalibrationCoefficients;
}

export class LinearCalibrationCurve extends CalibrationCurve {
    public calculate(pending: PendingCalibration): DataProto.Calibration {
        const points = pending.points.map(
            (p) =>
                new DataProto.CalibrationPoint({
                    references: p.references,
                    uncalibrated: p.uncalibrated,
                })
        );
        const coefficients = this.calculateCoefficients(pending);
        return DataProto.Calibration.create({
            type: DataProto.CurveType.CURVE_LINEAR,
            time: unixNow(),
            points: points,
            coefficients: coefficients,
        });
    }

    public calculateCoefficients(pending: PendingCalibration): DataProto.CalibrationCoefficients {
        const n = pending.points.length;
        const x = pending.points.map((p) => p.references[0]);
        const y = pending.points.map((p) => p.uncalibrated[0]);
        const indices = _.range(0, n);
        const xMean = _.mean(x);
        const yMean = _.mean(y);
        const numerParts = indices.map((i) => (x[i] - xMean) * (y[i] - yMean));
        const denomParts = indices.map((i) => (x[i] - xMean) ** 2);
        const numer = _.sum(numerParts);
        const denom = _.sum(denomParts);
        const m = numer / denom;
        const b = yMean - m * xMean;
        console.log(`cal:coeff ${JSON.stringify({ x, y, xMean, yMean, numerParts, denomParts, numer, denom, b, m })}`);
        return new DataProto.CalibrationCoefficients({ values: [b, m] });
    }
}

function getCurveForSensor(): CalibrationCurve {
    return new LinearCalibrationCurve();
    // throw new Error(`no curve for type: ${type}`);
}

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.STATIONS_LOADED]: ({ commit, dispatch, state }: ActionParameters, stations: Station[]) => {
            return stations.map((station) =>
                station.modules.map((m) => {
                    if (m.config) {
                        commit(MutationTypes.CALIBRATION_REFRESH, { moduleId: m.moduleId, status: m.config });
                    }
                })
            );
        },
        [ActionTypes.STATION_REPLY]: ({ commit, dispatch, state }: ActionParameters, payload: StationRepliedAction) => {
            return payload.statusReply.modules.map((m) => {
                if (m.status) {
                    commit(MutationTypes.CALIBRATION_REFRESH, { moduleId: m.moduleId, status: m.status });
                }
            });
        },
        [ActionTypes.CLEAR_SENSOR_CALIBRATION]: async ({ commit, dispatch, state }: ActionParameters, payload: ClearAtlasCalibration) => {
            const info = state.connected[payload.deviceId];
            if (!info) throw new Error(`no info for nearby station ${payload.deviceId}`);
            const service = new CalibrationService(services.conservify());
            const url = `${info.url}/modules/${payload.position}`;
            return await service.clearCalibration(url).then((cleared) => {
                console.log("cal:", "cleared", payload.moduleId, cleared);
                return commit(MutationTypes.CLEARED_CALIBRATION, { moduleId: payload.moduleId, status: cleared });
            });
        },
        [ActionTypes.CALIBRATE_BEGIN]: async ({ commit, dispatch, state }: ActionParameters, payload: CalibrateBegin) => {
            const info = state.connected[payload.deviceId];
            if (!info) throw new Error(`no info for nearby station ${payload.deviceId}`);
            const service = new CalibrationService(services.conservify());
            const url = `${info.url}/modules/${payload.position}`;
            return await service.clearCalibration(url).then((cleared) => {
                console.log("cal:", "cleared", payload.moduleId, cleared);
                return commit(MutationTypes.CLEARED_CALIBRATION, { moduleId: payload.moduleId, status: cleared });
            });
        },
        [ActionTypes.CALIBRATE_SENSOR]: async ({ commit, dispatch, state }: ActionParameters, payload: CalibrateAtlas) => {
            const moduleId = payload.moduleId;
            const info = state.connected[payload.deviceId];
            if (!info) throw new Error(`no info for nearby station ${payload.deviceId}`);
            const reply = await services.queryStation().takeReadings(info.url, null, { throttle: false });
            const lr = reply.liveReadings[0];
            if (!lr) throw new Error(`no live readings in reply`);
            const sm = lr.modules.find((m) => m.module.moduleId == moduleId);
            if (!sm) throw new Error(`no module: ${JSON.stringify(payload)}`);
            const values = sm.readings.map((r) => r.value);
            const pcp = new PendingCalibrationPoint([payload.value.reference], values);
            commit(MutationTypes.CALIBRATION_POINT, { moduleId: moduleId, point: pcp });

            const pending = state.pending[moduleId];
            const completed = pending.points.length == payload.expectedPoints;
            if (completed) {
                const curve = getCurveForSensor();
                const calibration = curve.calculate(pending);
                console.log(`cal-done: ${JSON.stringify(calibration)}`);

                const config = DataProto.ModuleConfiguration.create({
                    calibration: calibration,
                });

                const encoded = Buffer.from(DataProto.ModuleConfiguration.encodeDelimited(config).finish());
                const hex = encoded.toString("hex");
                console.log(`cal-hex`, encoded.length, hex);

                const service = new CalibrationService(services.conservify());
                const url = `${info.url}/modules/${payload.position}`;
                await service.calibrate(url, encoded);
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
    [MutationTypes.CALIBRATION_REFRESH]: (state: CalibrationState, payload: { moduleId: string; status: PossibleCalibrations }) => {
        Vue.set(state.status, payload.moduleId, payload.status);
    },
    [MutationTypes.CLEARED_CALIBRATION]: (state: CalibrationState, payload: { moduleId: string; status: PossibleCalibrations }) => {
        Vue.set(state.status, payload.moduleId, payload.status);
        Vue.set(state.pending, payload.moduleId, new PendingCalibration(payload.moduleId));
    },
    [MutationTypes.CALIBRATION_POINT]: (state: CalibrationState, payload: { moduleId: string; point: PendingCalibrationPoint }) => {
        const previous = state.pending[payload.moduleId] || new PendingCalibration(payload.moduleId);
        const updated = previous.append(payload.point);
        Vue.set(state.pending, payload.moduleId, updated);
        console.log(`cal-updated: ${JSON.stringify(updated)}`);
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
