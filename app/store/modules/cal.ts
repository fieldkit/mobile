import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { ActionTypes, StationRepliedAction } from "../actions";
import { MutationTypes } from "../mutations";
import { Station, ServiceInfo } from "../types";
import { ServiceRef } from "@/services";
import { CalibrationState, PendingCalibration, PendingCalibrationPoint, GlobalGetters } from "./global";
import { calibrationStrategies, StationCalibration, WaterCalValue } from "@/calibration";
import { fk_data as DataProto } from "fk-data-protocol/fk-data";
import CalibrationService from "@/services/calibration-service";
import { unixNow, CalibrationError } from "@/lib";

type ActionParameters = ActionContext<CalibrationState, never>;

type ModuleType = Module<CalibrationState, never>;

type ModuleConfiguration = DataProto.ModuleConfiguration;

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
        public readonly linear: boolean
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

export abstract class CalibrationCurve {
    public calculate(pending: PendingCalibration): DataProto.Calibration {
        const points = pending.points.map(
            (p) =>
                new DataProto.CalibrationPoint({
                    references: p.references,
                    uncalibrated: p.uncalibrated,
                })
        );
        if (points.length == 0) throw new CalibrationError(`calibration failed: empty`);
        const coefficients = this.calculateCoefficients(pending);
        return DataProto.Calibration.create({
            type: this.curveType,
            time: unixNow(),
            points: points,
            coefficients: coefficients,
        });
    }

    public abstract get curveType(): DataProto.CurveType;

    public abstract calculateCoefficients(pending: PendingCalibration): DataProto.CalibrationCoefficients;
}

function acceptableCoefficient(value: number): boolean {
    if (value === null || isNaN(value)) return false;
    return Math.abs(value) > 0.0001;
}

function acceptableOffset(value: number): boolean {
    if (value === null || isNaN(value)) return false;
    return true;
}

export class ExponentialCalibrationCurve extends CalibrationCurve {
    public get curveType(): DataProto.CurveType {
        return DataProto.CurveType.CURVE_EXPONENTIAL;
    }

    public calculateCoefficients(pending: PendingCalibration): DataProto.CalibrationCoefficients {
        const n = pending.points.length;
        const x = pending.points.map((p) => p.uncalibrated[0]);
        const y = pending.points.map((p) => p.references[0]);
        const indices = _.range(0, n);
        const xSum = _.sum(x);
        const ySum = _.sum(y);
        const xxSum = _.sum((x) => x * x);
        const xySum = _.sum(indices.map((i) => x[i] * y[i]));
        const m = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
        const b = ySum / n - (m * xSum) / n;
        console.log(`cal:exponential ${JSON.stringify({ x, y, n, xSum, ySum, xxSum, xySum })}`);
        if (!acceptableCoefficient(m)) throw new CalibrationError(`calibration failed: m=${m}`);
        if (!acceptableOffset(b)) throw new CalibrationError(`calibration failed: b=${b}`);
        return new DataProto.CalibrationCoefficients({ values: [b, m] });
    }
}

export class LinearCalibrationCurve extends CalibrationCurve {
    public get curveType(): DataProto.CurveType {
        return DataProto.CurveType.CURVE_LINEAR;
    }

    public calculateCoefficients(pending: PendingCalibration): DataProto.CalibrationCoefficients {
        const n = pending.points.length;
        const x = pending.points.map((p) => p.uncalibrated[0]);
        const y = pending.points.map((p) => p.references[0]);
        const indices = _.range(0, n);
        const xMean = _.mean(x);
        const yMean = _.mean(y);
        const numerParts = indices.map((i) => (x[i] - xMean) * (y[i] - yMean));
        const denomParts = indices.map((i) => (x[i] - xMean) ** 2);
        const numer = _.sum(numerParts);
        const denom = _.sum(denomParts);
        const m = numer / denom;
        const b = yMean - m * xMean;
        console.log(`cal:linear ${JSON.stringify({ x, y, xMean, yMean, numerParts, denomParts, numer, denom, b, m })}`);
        if (!acceptableCoefficient(m)) throw new CalibrationError(`calibration failed: m=${m}`);
        if (!acceptableOffset(b)) throw new CalibrationError(`calibration failed: b=${b}`);
        return new DataProto.CalibrationCoefficients({ values: [b, m] });
    }
}

function getCurveForSensor(curveType: DataProto.CurveType): CalibrationCurve {
    if (curveType == DataProto.CurveType.CURVE_EXPONENTIAL) {
        return new ExponentialCalibrationCurve();
    }
    return new LinearCalibrationCurve();
}

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.STATIONS_LOADED]: ({ commit, dispatch, state }: ActionParameters, stations: Station[]) => {
            return stations.map((station) =>
                station.modules.map((m) => {
                    if (m.configuration) {
                        commit(MutationTypes.MODULE_CONFIGURATION, { moduleId: m.moduleId, configuration: m.configuration });
                    }
                })
            );
        },
        [ActionTypes.STATION_REPLY]: ({ commit, dispatch, state }: ActionParameters, payload: StationRepliedAction) => {
            return payload.statusReply.modules.map((m) => {
                if (m.configuration) {
                    commit(MutationTypes.MODULE_CONFIGURATION, { moduleId: m.moduleId, configuration: m.configuration });
                }
            });
        },
        [ActionTypes.CLEAR_SENSOR_CALIBRATION]: async ({ commit, dispatch, state }: ActionParameters, payload: ClearWaterCalibration) => {
            const info = state.connected[payload.deviceId];
            if (!info) throw new Error(`no info for nearby station ${payload.deviceId}`);
            const service = new CalibrationService(services.conservify());
            const url = `${info.url}/modules/${payload.position}`;
            return await service.clearCalibration(url).then((cleared) => {
                console.log("cal:", "cleared", payload.moduleId, cleared);
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
            const reply = await services.queryStation().takeReadings(info.url, null, { throttle: false });
            const lr = reply.liveReadings[0];
            if (!lr) throw new Error(`no live readings in reply`);
            const sm = lr.modules.find((m) => m.module.moduleId == moduleId);
            if (!sm) throw new Error(`no module: ${JSON.stringify(payload)}`);
            const values = sm.readings.map((r) => r.value);
            const pcp = new PendingCalibrationPoint(payload.value.index, [payload.value.reference], values);
            commit(MutationTypes.CALIBRATION_POINT, { moduleId: moduleId, point: pcp });

            const pending = state.pending[moduleId];
            const completed = pending.points.length == payload.expectedPoints;
            if (completed) {
                try {
                    const curve = getCurveForSensor(
                        payload.linear ? DataProto.CurveType.CURVE_LINEAR : DataProto.CurveType.CURVE_EXPONENTIAL
                    );
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
                    const reply = await service.calibrate(url, encoded);

                    commit(MutationTypes.MODULE_CONFIGURATION, { moduleId: moduleId, configuration: reply });
                } catch (error) {
                    if (CalibrationError.isInstance(error)) {
                        console.log(`calibration failed:`, error);
                    }
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
