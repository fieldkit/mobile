import _ from "lodash";
import { CalibrationVisual, HasVisual } from "./visuals";
import { LegacyStation, Module } from "../store/types";
import { debug, _L, notEmpty, unixNow, CalibrationError } from "@/lib";
import { fk_data as DataProto } from "fk-data-protocol/fk-data";

export type ModuleConfiguration = DataProto.ModuleConfiguration;

export class Ids {
    private static c = 0;

    static make(): string {
        return `ids-${Ids.c++}`;
    }
}

export abstract class CalibrationValue {}

export class CalibratingSensor {
    constructor(
        public readonly stationId: number,
        public readonly moduleId: string,
        public readonly connected: boolean,
        public readonly position: number,
        public readonly unitOfMeasure: string,
        public readonly factory: number | null,
        public readonly calibrated: number | null,
        public readonly uncalibrated: number | null,
        public readonly calibrationValue: CalibrationValue,
        public readonly moduleCalibration: ModuleConfiguration | null,
        public readonly sensors: { [index: string]: number }
    ) {}
}

export abstract class CalibrationStep {
    public readonly id = Ids.make();

    abstract get children(): CalibrationStep[];

    get allChildren(): CalibrationStep[] {
        return _.union(_.flatten(this.children.map((c) => c.allChildren)), [this]);
    }
}

export abstract class EmptyCalibrationStep extends CalibrationStep {
    public get children(): CalibrationStep[] {
        return [];
    }
}

export class VisualCalibrationStep extends EmptyCalibrationStep implements HasVisual {
    constructor(public readonly visual: CalibrationVisual) {
        super();
    }
}

export class CalibrationPointStep extends CalibrationStep {
    public readonly children: CalibrationStep[];

    constructor(public readonly value: CalibrationValue, visuals: CalibrationVisual[]) {
        super();
        this.children = visuals.map((v) => new VisualCalibrationStep(v));
    }

    public adjustReference(reference: CalibrationValue): CalibrationPointStep {
        return new CalibrationPointStep(
            reference,
            this.children.map((c) => (<VisualCalibrationStep>c).visual)
        );
    }
}

export class CalibrationReference {
    constructor(public readonly value: CalibrationValue) {}
}

export class CalibrationStrategy extends CalibrationStep {
    constructor(
        public readonly moduleKey: string,
        public readonly heading: string,
        public readonly help: string,
        public readonly steps: CalibrationStep[]
    ) {
        super();
    }

    public get children(): CalibrationStep[] {
        return this.steps;
    }

    public get references(): CalibrationReference[] {
        return this.calibrationPointSteps()
            .map((step) => new CalibrationReference(step.value))
            .filter(notEmpty);
    }

    public getStepCalibrationValue(step: CalibrationStep): CalibrationValue {
        // All our possible steps we could be given will be grandchildren of us.
        const containing = _.first(this.calibrationPointSteps().filter((p) => p.children.includes(step)));
        if (containing) {
            if (!containing.value) throw new Error("containing step has invalid calibration value");
            return containing.value;
        }
        throw new Error("containing step has no calibration values");
    }

    public adjustReferences(references: CalibrationValue[]): CalibrationStrategy {
        const adjustedSteps = this.calibrationPointSteps().map((step, index) => {
            if (!references[index]) throw new Error();
            return step.adjustReference(references[index]);
        });
        return new CalibrationStrategy(this.moduleKey, this.heading, this.help, adjustedSteps);
    }

    public get numberOfCalibrationPoints(): number {
        return this.calibrationPointSteps().length;
    }

    /**
     * Determine the curve type for the module. Not super happy with this approach.
     */
    public get curveType(): DataProto.CurveType {
        if (/modules.water.ec/.test(this.moduleKey)) {
            debug.log(`curve type: module-key=${this.moduleKey}: exponential`);
            return DataProto.CurveType.CURVE_EXPONENTIAL;
        }
        debug.log(`curve type: module-key=${this.moduleKey}: linear`);
        return DataProto.CurveType.CURVE_LINEAR;
    }

    private calibrationPointSteps(): CalibrationPointStep[] {
        return this.steps.filter((step) => step instanceof CalibrationPointStep).map((step) => step as CalibrationPointStep);
    }
}

export class CalibrationStrategies {
    constructor(public readonly strategies: CalibrationStrategy[]) {}

    public getModuleStrategies(moduleKey: string): CalibrationStrategy[] {
        const byKey = _.groupBy(this.strategies, (s) => s.moduleKey);
        return byKey[moduleKey] || [];
    }
}

export type ModuleConfigurationByModuleId = { [index: string]: ModuleConfiguration };

export class ModuleCalibration {
    public readonly moduleKey: string;
    public readonly name: string;
    public readonly position: number;
    public readonly image: string;
    public readonly canCalibrate: boolean;
    public readonly isCalibrated: boolean;
    public readonly needsCalibration: boolean;

    constructor(module: Module, configuration: ModuleConfiguration | null, haveStrategies: boolean) {
        this.moduleKey = module.name;
        this.name = _L(module.name + ".name");
        this.position = module.position || 0;
        this.image = module.image;
        this.canCalibrate = haveStrategies;
        this.isCalibrated = ModuleCalibration.isCalibrated(configuration);
        this.needsCalibration = this.canCalibrate && !this.isCalibrated;
    }

    private static isCalibrated(config: ModuleConfiguration | null): boolean {
        if (!config) return false;
        if (!config.calibration) return false;
        if (!config.calibration.type) return false;
        return true;
    }
}

export class StationCalibration {
    public readonly id: number;
    public readonly name: string;
    public readonly connected: boolean;
    public readonly modules: ModuleCalibration[] = [];

    constructor(station: LegacyStation, configurations: ModuleConfigurationByModuleId, calibrationStrategies: CalibrationStrategies) {
        if (!station.id) throw new Error("missing station id");
        this.id = station.id;
        this.name = station.name;
        this.connected = station.connected || false;
        this.modules = station.modules
            .filter((m) => !m.internal)
            .map((m) => {
                const haveStrategies = calibrationStrategies.getModuleStrategies(m.name).length > 0;
                return new ModuleCalibration(m, configurations[m.moduleId], haveStrategies);
            });
    }

    get completed(): boolean {
        return this.modules.filter((m) => m.needsCalibration).length == 0;
    }
}

export class PendingCalibrationPoint {
    constructor(
        public readonly index: number,
        public readonly references: number[],
        public readonly uncalibrated: number[],
        public readonly factory: number[]
    ) {}
}

export class PendingCalibration {
    constructor(public readonly moduleId: string, public readonly points: PendingCalibrationPoint[] = []) {}

    public append(pcp: PendingCalibrationPoint): PendingCalibration {
        const newPoints = _.clone(this.points);
        newPoints[pcp.index] = pcp;
        return new PendingCalibration(this.moduleId, newPoints);
    }
}

export abstract class CalibrationCurve {
    public calculate(pending: PendingCalibration): DataProto.Calibration {
        const points = pending.points.map(
            (p) =>
                new DataProto.CalibrationPoint({
                    references: p.references,
                    uncalibrated: p.uncalibrated,
                    factory: p.factory,
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
        const len = pending.points.length;
        const x = pending.points.map((p) => p.uncalibrated[0]);
        const y = pending.points.map((p) => p.references[0]);

        const indices = _.range(0, len);
        const xSum = _.sum(x.map((x) => Math.log(x))); // sum0
        const xySum = _.sum(indices.map((i) => Math.log(x[i]) * Math.log(y[i]))); // sum1
        const ySum = _.sum(y.map((y) => Math.log(y))); // sum2
        const xSquaredSum = _.sum(indices.map((i) => Math.log(x[i]) * Math.log(x[i]))); // sum3

        const sum0 = xSum;
        const sum1 = xySum;
        const sum2 = ySum;
        const sum3 = xSquaredSum;

        const b = (len * sum1 - sum0 * sum2) / (len * sum3 - sum0 ** 2);
        const a = Math.exp((sum2 - b * sum0) / len);

        debug.log(`cal:exponential ${JSON.stringify({ x, y, len, xSum, ySum, xySum, xSquaredSum })}`);
        if (!acceptableCoefficient(a)) throw new CalibrationError(`calibration failed: a=${a}`);
        if (!acceptableCoefficient(b)) throw new CalibrationError(`calibration failed: b=${b}`);
        return new DataProto.CalibrationCoefficients({ values: [a, b] });
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
        debug.log(`cal:linear ${JSON.stringify({ x, y, xMean, yMean, numerParts, denomParts, numer, denom, b, m })}`);
        if (!acceptableCoefficient(m)) throw new CalibrationError(`calibration failed: m=${m}`);
        if (!acceptableOffset(b)) throw new CalibrationError(`calibration failed: b=${b}`);
        return new DataProto.CalibrationCoefficients({ values: [b, m] });
    }
}

export function getCurveForSensor(curveType: DataProto.CurveType): CalibrationCurve {
    switch (curveType) {
        case DataProto.CurveType.CURVE_EXPONENTIAL:
            return new ExponentialCalibrationCurve();
    }
    return new LinearCalibrationCurve();
}
