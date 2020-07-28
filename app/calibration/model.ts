import _ from "lodash";
import { CalibrationVisual, HasVisual } from "./visuals";

export class Ids {
    private static c = 0;

    static make(): string {
        return "ids-" + Ids.c++;
    }
}

export class CalibratingSensor {
    constructor(
        public readonly stationId: number,
        public readonly connected: boolean,
        public readonly position: number,
        public readonly unitOfMeasure: string,
        public readonly reading: number,
        public readonly sensors: { [index: string]: number }
    ) {}
}

export class CalibrationValue {
    constructor(value: number) {}
}

export abstract class CalibrationStep {
    public readonly id = Ids.make();

    constructor() {}

    abstract get children(): CalibrationStep[];

    abstract get completed(): boolean;

    get allChildren(): CalibrationStep[] {
        return _.union(_.flatten(this.children.map((c) => c.allChildren)), [this]);
    }
}

export abstract class EmptyCalibrationStep extends CalibrationStep {
    get children(): CalibrationStep[] {
        return [];
    }

    // The assumption here, is that the parent PointStep will have
    // answered this question.
    get completed(): boolean {
        return false;
    }
}

export class VisualCalibrationStep extends EmptyCalibrationStep implements HasVisual {
    constructor(public readonly visual: CalibrationVisual) {
        super();
    }
}

export class CalibrationCheckStep extends VisualCalibrationStep {
    constructor(visual: CalibrationVisual) {
        super(visual);
    }
}

export class CalibrationPrepareStep extends VisualCalibrationStep {
    constructor(visual: CalibrationVisual) {
        super(visual);
    }
}

export class CalibrationWaitStep extends VisualCalibrationStep {
    constructor(visual: CalibrationVisual) {
        super(visual);
    }
}

export class CalibrationConfirmStep extends VisualCalibrationStep {
    constructor(visual: CalibrationVisual) {
        super(visual);
    }
}

type CalibrationPointVisuals = {
    check: CalibrationVisual[];
    prepare: CalibrationVisual[];
    wait: CalibrationVisual[];
    confirm: CalibrationVisual[];
};

export class CalibrationPointStep extends CalibrationStep {
    public readonly children: CalibrationStep[];

    constructor(public readonly value: CalibrationValue, public readonly visuals: CalibrationPointVisuals) {
        super();
        this.children = _.flatten([
            this.visuals.check.map((v) => new CalibrationCheckStep(v)),
            this.visuals.prepare.map((v) => new CalibrationPrepareStep(v)),
            this.visuals.wait.map((v) => new CalibrationWaitStep(v)),
            this.visuals.confirm.map((v) => new CalibrationConfirmStep(v)),
        ]);
    }

    get completed(): boolean {
        // TODO Check the calibration data of the module.
        return false;
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

    get children(): CalibrationStep[] {
        return this.steps;
    }

    get completed(): boolean {
        // TODO Check the calibration data of the module.
        return false;
    }
}

export class CalibrationStrategies {
    constructor(public readonly strategies: CalibrationStrategy[]) {}

    public getModuleStrategies(moduleKey: string): CalibrationStrategy[] {
        const byKey = _.groupBy(this.strategies, (s) => s.moduleKey);
        return byKey[moduleKey] || [];
    }
}
