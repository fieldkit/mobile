import { CalibrationValue } from "./model";

export class CalibrationVisual {
    constructor(public readonly component: any) {}
}

export interface CommonInfo {
    sensor: string;
    unitOfMeasure: string;
    title: string;
    subtitle: string;
    icon: string;
}

export interface PrepareInfo extends CommonInfo {
    heading: string;
    instructions: string;
    image: string;
    done: string;
}

export class PrepareVisual extends CalibrationVisual implements PrepareInfo {
    public readonly sensor: string;
    public readonly unitOfMeasure: string;
    public readonly title: string;
    public readonly subtitle: string;
    public readonly icon: string;

    public readonly heading: string;
    public readonly instructions: string;
    public readonly image: string;
    public readonly done: string;

    constructor(component: any, info: PrepareInfo) {
        super(component);
        this.sensor = info.sensor;
        this.unitOfMeasure = info.unitOfMeasure;
        this.title = info.title;
        this.subtitle = info.subtitle;
        this.icon = info.icon;
        this.heading = info.heading;
        this.instructions = info.instructions;
        this.image = info.image;
        this.done = info.done;
    }
}

export interface WaitInfo extends CommonInfo {
    expected: CalibrationValue;
    seconds: number;
    heading: string;
    done: string;
}

export class WaitVisual extends CalibrationVisual implements WaitInfo {
    public readonly sensor: string;
    public readonly unitOfMeasure: string;
    public readonly title: string;
    public readonly subtitle: string;
    public readonly icon: string;
    public readonly expected: CalibrationValue;
    public readonly seconds: number;
    public readonly heading: string;
    public readonly done: string;

    constructor(component: any, info: WaitInfo) {
        super(component);
        this.sensor = info.sensor;
        this.unitOfMeasure = info.unitOfMeasure;
        this.title = info.title;
        this.subtitle = info.subtitle;
        this.icon = info.icon;
        this.expected = info.expected;
        this.seconds = info.seconds;
        this.heading = info.heading;
        this.done = info.done;
    }
}

export interface HasVisual {
    readonly visual: CalibrationVisual;
}
