import _ from "lodash";
import { CalibrationVisual, HasVisual } from "./visuals";

export class Ids {
    private static c = 0;

    static make(): string {
        return "ids-" + Ids.c++;
    }
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

export class CalibrationMoveStep extends VisualCalibrationStep {
    constructor(visual: CalibrationVisual) {
        super(visual);
    }
}

export class CalibrationWaitStep extends VisualCalibrationStep {
    constructor(visual: CalibrationVisual, public readonly seconds: number) {
        super(visual);
    }
}

export class CalibrationConfirmStep extends VisualCalibrationStep {
    constructor(visual: CalibrationVisual) {
        super(visual);
    }
}

type CalibrationPointVisuals = {
    move: CalibrationVisual[];
    wait: CalibrationVisual[];
    confirm: CalibrationVisual[];
};

export class CalibrationPointStep extends CalibrationStep {
    public readonly children: CalibrationStep[];

    constructor(public readonly value: CalibrationValue, public readonly visuals: CalibrationPointVisuals) {
        super();
        this.children = _.flatten([
            this.visuals.move.map((v) => new CalibrationMoveStep(v)),
            this.visuals.wait.map((v) => new CalibrationWaitStep(v, 120)),
            this.visuals.confirm.map((v) => new CalibrationConfirmStep(v)),
        ]);
    }

    get completed(): boolean {
        // TODO Check the calibration data of the module.
        return false;
    }
}

export class CalibrationStrategy extends CalibrationStep {
    constructor(public readonly steps: CalibrationStep[]) {
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

import PhVisuals from "./PhVisuals";

const Ph1 = new CalibrationStrategy([new CalibrationPointStep(new CalibrationValue(7), PhVisuals.middle)]);
const Ph3 = new CalibrationStrategy([
    new CalibrationPointStep(new CalibrationValue(7), PhVisuals.middle),
    new CalibrationPointStep(new CalibrationValue(4), PhVisuals.low),
    new CalibrationPointStep(new CalibrationValue(10), PhVisuals.high),
]);

export class CalibrationStrategies {
    constructor(public readonly strategies: CalibrationStrategy[]) {}
}

export default new CalibrationStrategies([Ph1, Ph3]);
