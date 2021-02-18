import _ from "lodash";
import { CalibrationVisual, HasVisual } from "./visuals";
import { LegacyStation, Module, ModuleConfiguration } from "../store/types";
import { _T, convertOldFirmwareResponse, notEmpty } from "../utilities";

export { ModuleConfiguration };

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
    public readonly name: string;
    public readonly position: number;
    public readonly image: string;
    public readonly canCalibrate: boolean;
    public readonly isCalibrated: boolean;
    public readonly needsCalibration: boolean;

    constructor(module: Module, configuration: ModuleConfiguration | null, haveStrategies: boolean) {
        this.name = _T(convertOldFirmwareResponse(module) + ".name");
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
