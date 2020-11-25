import _ from "lodash";
import { CalibrationVisual, HasVisual } from "./visuals";
import { LegacyStation, Module, ModuleStatus } from "../store/types";
import { _T, convertOldFirmwareResponse } from "../utilities";

export { ModuleStatus };

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
        public readonly reading: number | null,
        public readonly calibrationValue: CalibrationValue,
        public readonly moduleCalibration: ModuleStatus | null,
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

    public getStepCalibrationValue(step: CalibrationStep): CalibrationValue {
        // NOTE Right now all our given step's instances will be grandchildren of us.
        const containing = _.first(this.steps.filter((p) => p.children.includes(step)));
        if (containing instanceof CalibrationPointStep) {
            if (!containing.value) {
                throw new Error("containing step has invalid calibration value");
            }
            return containing.value;
        }
        throw new Error("containing step has no calibration values");
    }
}

export class CalibrationStrategies {
    constructor(public readonly strategies: CalibrationStrategy[]) {}

    public getModuleStrategies(moduleKey: string): CalibrationStrategy[] {
        const byKey = _.groupBy(this.strategies, (s) => s.moduleKey);
        return byKey[moduleKey] || [];
    }
}

export type ModuleStatusByModuleId = { [index: string]: ModuleStatus };

export class ModuleCalibration {
    public readonly name: string;
    public readonly position: number;
    public readonly image: string;
    public readonly canCalibrate: boolean;
    public readonly isCalibrated: boolean;
    public readonly needsCalibration: boolean;

    constructor(module: Module, status: ModuleStatus | null, haveStrategies: boolean) {
        this.name = _T(convertOldFirmwareResponse(module) + ".name");
        this.position = module.position || 0;
        this.image = module.image;
        const effective = status || module.status;
        this.canCalibrate = !!effective?.calibration && haveStrategies;
        this.isCalibrated = (effective?.calibration?.total || 0) > 0;
        this.needsCalibration = this.canCalibrate && !this.isCalibrated;
    }
}

export class StationCalibration {
    public readonly id: number;
    public readonly name: string;
    public readonly connected: boolean;
    public readonly modules: ModuleCalibration[] = [];

    constructor(station: LegacyStation, statuses: ModuleStatusByModuleId, calibrationStrategies: CalibrationStrategies) {
        if (!station.id) throw new Error("missing station id");
        this.id = station.id;
        this.name = station.name;
        this.connected = station.connected || false;
        this.modules = station.modules
            .filter((m) => !m.internal)
            .map((m) => {
                const haveStrategies = calibrationStrategies.getModuleStrategies(m.name).length > 0;
                return new ModuleCalibration(m, statuses[m.moduleId], haveStrategies);
            });

        const status = {
            modules: this.modules.map((m) => [m.name, m.isCalibrated]),
            self: this,
        };
        console.log(`station-calibration ${JSON.stringify(status)}`);
    }

    get completed(): boolean {
        return this.modules.filter((m) => m.needsCalibration).length == 0;
    }
}
