import { CalibrationStrategy, CalibrationPointStep, CalibrationValue } from "./model";
import { CheckVisual, PrepareVisual, WaitVisual } from "./visuals";

import Check from "./Check.vue";
import Prepare from "./Prepare.vue";
import Wait from "./Wait.vue";

type Range = [number, number];

const PhRange: Range = [0, 14];
const DoRange: Range = [0, 100000];
const EcRange: Range = [0, 100000];
const OrpRange: Range = [0, 100000];

export class CalibrationCommand {
    constructor(public readonly key: string) {}
}

const commands = {
    PhLow: new CalibrationCommand("calibration.references.low"),
    PhMiddle: new CalibrationCommand("calibration.references.middle"),
    PhHigh: new CalibrationCommand("calibration.references.high"),

    DoLow: new CalibrationCommand("calibration.references.low"),
    DoMiddle: new CalibrationCommand("calibration.references.middle"),
    DoHigh: new CalibrationCommand("calibration.references.high"),

    EcLow: new CalibrationCommand("calibration.references.low"),
    EcMiddle: new CalibrationCommand("calibration.references.middle"),
    EcHigh: new CalibrationCommand("calibration.references.high"),

    OrpLow: new CalibrationCommand("calibration.references.low"),
    OrpMiddle: new CalibrationCommand("calibration.references.middle"),
    OrpHigh: new CalibrationCommand("calibration.references.high"),
};

export class WaterCalValue extends CalibrationValue {
    constructor(public readonly reference: number, public readonly range: Range, public readonly command: CalibrationCommand) {
        super();
    }

    public get label(): string {
        return this.command.key;
    }
}

export interface CommonProperties {
    sensor: string;
    unitOfMeasure: string;
    title: string;
    subtitle: string;
    icon: string;
    done: string;
}

function PhCommon(): CommonProperties {
    return {
        sensor: "ph",
        unitOfMeasure: "pH",
        title: _L("setup"),
        subtitle: _L("waterPh"),
        icon: "~/images/Icon_WaterpH_Module.png",
        done: _L("next"),
    };
}

function DoCommon(): CommonProperties {
    return {
        sensor: "do",
        unitOfMeasure: "mg/L",
        title: _L("setup"),
        subtitle: _L("waterDissolvedOxygen"),
        icon: "~/images/Icon_DissolvedOxygen_Module.png",
        done: _L("next"),
    };
}

function EcCommon(): CommonProperties {
    return {
        sensor: "ec",
        unitOfMeasure: "μS",
        title: _L("setup"),
        subtitle: _L("waterConductivity"),
        icon: "~/images/Icon_WaterConductivity_Module.png",
        done: _L("next"),
    };
}

function OrpCommon(): CommonProperties {
    return {
        sensor: "orp",
        unitOfMeasure: "",
        title: _L("setup"),
        subtitle: _L("waterOrp"),
        icon: "~/images/Icon_WaterConductivity_Module.png", // WRONG
        done: _L("next"),
    };
}

const Ph3 = (): CalibrationStrategy => {
    const phCommon = PhCommon();

    return new CalibrationStrategy("modules.water.ph", _L("threePointCalibration"), _L("threePointCalibration"), [
        new CalibrationPointStep(new WaterCalValue(7, PhRange, commands.PhMiddle), [
            new CheckVisual(Check, {
                ...phCommon,
                heading: _L("threePointCalibration"),
                done: _L("next"),
                skip: _L("skip"),
            }),
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("threePointCalibration"),
                instructions: _L("makeSureYouHavePhFluids"),
                image: "~/images/TI_11_three_bottles.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("midPointCalibration"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("midPointCalibration"),
                instructions: _L("placeProbeIn7Solution"),
                image: "~/images/TI_13-C.jpg",
                done: _L("startTimer"),
            }),
            new WaitVisual(Wait, {
                ...phCommon,
                seconds: 120,
                heading: _L("midPointCalibration"),
                done: _L("calibrate"),
            }),
        ]),
        new CalibrationPointStep(new WaterCalValue(4, PhRange, commands.PhLow), [
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("lowPointCalibration"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("lowPointCalibration"),
                instructions: _L("placeProbeIn4Solution"),
                image: "~/images/TI_13-C.jpg",
                done: _L("startTimer"),
            }),
            new WaitVisual(Wait, {
                ...phCommon,
                seconds: 120,
                heading: _L("lowPointCalibration"),
                done: _L("calibrate"),
            }),
        ]),
        new CalibrationPointStep(new WaterCalValue(10, PhRange, commands.PhHigh), [
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("highPointCalibration"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("highPointCalibration"),
                instructions: _L("placeProbeIn10Solution"),
                image: "~/images/TI_13-C.jpg",
                done: _L("startTimer"),
            }),
            new WaitVisual(Wait, {
                ...phCommon,
                seconds: 120,
                heading: _L("highPointCalibration"),
                done: _L("calibrate"),
            }),
        ]),
    ]);
};

const Do3 = (): CalibrationStrategy => {
    const doCommon = DoCommon();

    return new CalibrationStrategy("modules.water.do", _L("waterDissolvedOxygen"), _L("waterDissolvedOxygen"), [
        new CalibrationPointStep(new WaterCalValue(0.0, DoRange, commands.DoLow), [
            new CheckVisual(Check, {
                ...doCommon,
                heading: _L("dissovedOxygenCalibration"),
                done: _L("next"),
                skip: _L("skip"),
            }),
            new PrepareVisual(Prepare, {
                ...doCommon,
                heading: _L("dissovedOxygenCalibration"),
                instructions: _L("dryProbeBefore"),
                image: "~/images/TI_16-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...doCommon,
                heading: _L("dissovedOxygenCalibration"),
                instructions: _L("holdProbeOut"),
                image: "~/images/TI_16-B.jpg",
                done: _L("next"),
            }),
            new WaitVisual(Wait, {
                ...doCommon,
                seconds: 120,
                heading: _L("dissovedOxygenCalibration"),
                done: _L("calibrate"),
            }),
        ]),
        new CalibrationPointStep(new WaterCalValue(0.0, DoRange, commands.DoMiddle), [
            new CheckVisual(Check, {
                ...doCommon,
                heading: _L("dissovedOxygenCalibration"),
                done: _L("next"),
                skip: _L("skip"),
            }),
            new PrepareVisual(Prepare, {
                ...doCommon,
                heading: _L("dissovedOxygenCalibration"),
                instructions: _L("dryProbeBefore"),
                image: "~/images/TI_16-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...doCommon,
                heading: _L("dissovedOxygenCalibration"),
                instructions: _L("holdProbeOut"),
                image: "~/images/TI_16-B.jpg",
                done: _L("next"),
            }),
            new WaitVisual(Wait, {
                ...doCommon,
                seconds: 120,
                heading: _L("dissovedOxygenCalibration"),
                done: _L("calibrate"),
            }),
        ]),
        new CalibrationPointStep(new WaterCalValue(0.0, DoRange, commands.DoHigh), [
            new CheckVisual(Check, {
                ...doCommon,
                heading: _L("dissovedOxygenCalibration"),
                done: _L("next"),
                skip: _L("skip"),
            }),
            new PrepareVisual(Prepare, {
                ...doCommon,
                heading: _L("dissovedOxygenCalibration"),
                instructions: _L("dryProbeBefore"),
                image: "~/images/TI_16-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...doCommon,
                heading: _L("dissovedOxygenCalibration"),
                instructions: _L("holdProbeOut"),
                image: "~/images/TI_16-B.jpg",
                done: _L("next"),
            }),
            new WaitVisual(Wait, {
                ...doCommon,
                seconds: 120,
                heading: _L("dissovedOxygenCalibration"),
                done: _L("calibrate"),
            }),
        ]),
    ]);
};

const Ec3 = (): CalibrationStrategy => {
    const ecCommon = EcCommon();

    return new CalibrationStrategy("modules.water.ec", _L("waterConductivity"), _L("waterConductivity"), [
        new CalibrationPointStep(new WaterCalValue(0.0, EcRange, commands.EcLow), [
            new CheckVisual(Check, {
                ...ecCommon,
                heading: _L("waterConductivity"),
                done: _L("next"),
                skip: _L("skip"),
            }),
            new PrepareVisual(Prepare, {
                ...ecCommon,
                heading: _L("part1Dry"),
                instructions: _L("dryProbeBefore"),
                image: "~/images/TI_16-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...ecCommon,
                heading: _L("part1Dry"),
                instructions: _L("holdProbeOut"),
                image: "~/images/TI_16-B.jpg",
                done: _L("next"),
            }),
            new WaitVisual(Wait, {
                ...ecCommon,
                seconds: 120,
                heading: _L("dissovedOxygenCalibration"),
                done: _L("calibrate"),
            }),
        ]),
        new CalibrationPointStep(new WaterCalValue(12880 / 2, EcRange, commands.EcMiddle), [
            new PrepareVisual(Prepare, {
                ...ecCommon,
                heading: _L("part2Wet"),
                instructions: _L("haveYourConductivitySolution"),
                image: "~/images/TI_11.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...ecCommon,
                heading: _L("part2Wet"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...ecCommon,
                heading: _L("part2Wet"),
                instructions: _L("placeInAndStabilizeWithTemp"),
                image: "~/images/TI_13-C.jpg",
                done: _L("next"),
            }),
            new WaitVisual(Wait, {
                ...ecCommon,
                seconds: 120,
                heading: _L("dissovedOxygenCalibration"),
                done: _L("calibrate"),
            }),
        ]),
        new CalibrationPointStep(new WaterCalValue(12880, EcRange, commands.EcHigh), [
            new PrepareVisual(Prepare, {
                ...ecCommon,
                heading: _L("part2Wet"),
                instructions: _L("haveYourConductivitySolution"),
                image: "~/images/TI_11.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...ecCommon,
                heading: _L("part2Wet"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...ecCommon,
                heading: _L("part2Wet"),
                instructions: _L("placeInAndStabilizeWithTemp"),
                image: "~/images/TI_13-C.jpg",
                done: _L("next"),
            }),
            new WaitVisual(Wait, {
                ...ecCommon,
                seconds: 120,
                heading: _L("dissovedOxygenCalibration"),
                done: _L("calibrate"),
            }),
        ]),
    ]);
};

const Orp3 = (): CalibrationStrategy => {
    const orpCommon = OrpCommon();

    return new CalibrationStrategy("modules.water.orp", _L("modules.water.orp.name"), _L("modules.water.orp.name"), [
        new CalibrationPointStep(new WaterCalValue(0.0, OrpRange, commands.OrpLow), [
            new CheckVisual(Check, {
                ...orpCommon,
                heading: _L("modules.water.orp.name"),
                done: _L("next"),
                skip: _L("skip"),
            }),
            new PrepareVisual(Prepare, {
                ...orpCommon,
                heading: _L("part1Dry"),
                instructions: _L("dryProbeBefore"),
                image: "~/images/TI_16-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...orpCommon,
                heading: _L("part1Dry"),
                instructions: _L("holdProbeOut"),
                image: "~/images/TI_16-B.jpg",
                done: _L("next"),
            }),
            new WaitVisual(Wait, {
                ...orpCommon,
                seconds: 120,
                heading: _L("orpCalibration"),
                done: _L("calibrate"),
            }),
        ]),
        new CalibrationPointStep(new WaterCalValue(12880 / 2, OrpRange, commands.OrpMiddle), [
            new PrepareVisual(Prepare, {
                ...orpCommon,
                heading: _L("part2Wet"),
                instructions: _L("haveYourConductivitySolution"),
                image: "~/images/TI_11.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...orpCommon,
                heading: _L("part2Wet"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...orpCommon,
                heading: _L("part2Wet"),
                instructions: _L("placeInAndStabilizeWithTemp"),
                image: "~/images/TI_13-C.jpg",
                done: _L("next"),
            }),
            new WaitVisual(Wait, {
                ...orpCommon,
                seconds: 120,
                heading: _L("orpCalibration"),
                done: _L("calibrate"),
            }),
        ]),
        new CalibrationPointStep(new WaterCalValue(12880, OrpRange, commands.OrpHigh), [
            new PrepareVisual(Prepare, {
                ...orpCommon,
                heading: _L("part2Wet"),
                instructions: _L("haveYourConductivitySolution"),
                image: "~/images/TI_11.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...orpCommon,
                heading: _L("part2Wet"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...orpCommon,
                heading: _L("part2Wet"),
                instructions: _L("placeInAndStabilizeWithTemp"),
                image: "~/images/TI_13-C.jpg",
                done: _L("next"),
            }),
            new WaitVisual(Wait, {
                ...orpCommon,
                seconds: 120,
                heading: _L("orpCalibration"),
                done: _L("calibrate"),
            }),
        ]),
    ]);
};

export function Common(): { [index: string]: CommonProperties } {
    return {
        "modules.water.ph": PhCommon(),
        "modules.water.ec": EcCommon(),
        "modules.water.do": DoCommon(),
        "modules.water.orp": OrpCommon(),
    };
}

export default function (): CalibrationStrategy[] {
    return [Ph3(), Do3(), Ec3(), Orp3()];
}
