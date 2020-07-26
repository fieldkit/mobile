export class CalibrationVisual {
    constructor(public readonly component: any) {}
}

export interface HasVisual {
    readonly visual: CalibrationVisual;
}
