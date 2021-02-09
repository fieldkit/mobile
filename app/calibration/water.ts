import { CalibrationStrategy, CalibrationPointStep, CalibrationValue } from "./model";
import { CheckVisual, PrepareVisual, WaitVisual } from "./visuals";
import { fk_atlas } from "fk-atlas-protocol/fk-atlas";

import Check from "./Check.vue";
import Prepare from "./Prepare.vue";
import Wait from "./Wait.vue";

const DoCalibrateCommand = fk_atlas.DoCalibrateCommand;
const PhCalibrateCommand = fk_atlas.PhCalibrateCommand;
const EcCalibrateCommand = fk_atlas.EcCalibrateCommand;

type Range = [number, number];

const PhRange: Range = [0, 14];
const DoRange: Range = [0, 100000];
const EcRange: Range = [0, 100000];

export class AtlasCommand {
    constructor(public readonly which: number, public readonly key: string) {}
}

const commands = {
    PhLow: new AtlasCommand(PhCalibrateCommand.CALIBRATE_PH_LOW, "calibration.references.low"),
    PhMiddle: new AtlasCommand(PhCalibrateCommand.CALIBRATE_PH_MIDDLE, "calibration.references.middle"),
    PhHigh: new AtlasCommand(PhCalibrateCommand.CALIBRATE_PH_HIGH, "calibration.references.high"),
    DoAtmosphere: new AtlasCommand(DoCalibrateCommand.CALIBRATE_DO_ATMOSPHERE, "calibration.references.atmosphere"),
    EcDry: new AtlasCommand(EcCalibrateCommand.CALIBRATE_EC_DRY, "calibration.references.dry"),
    EcSingle: new AtlasCommand(EcCalibrateCommand.CALIBRATE_EC_SINGLE, "calibration.references.single"),
};

export class AtlasCalValue extends CalibrationValue {
    constructor(public readonly reference: number, public readonly range: Range, public readonly command: AtlasCommand) {
        super();
    }

    public get which(): number {
        return this.command.which;
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

const PhQuick = (): CalibrationStrategy => {
    const phCommon = PhCommon();

    return new CalibrationStrategy("modules.water.ph", _L("quickCalibration"), _L("quickCalibration"), [
        new CalibrationPointStep(new AtlasCalValue(6.86, PhRange, commands.PhMiddle), [
            new CheckVisual(Check, {
                ...phCommon,
                heading: _L("quickPhCalibration"),
                done: _L("next"),
                skip: _L("skip"),
            }),
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("quickPhCalibration"),
                instructions: _L("haveYourQuickSolution"),
                image: "~/images/TI_11.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("quickPhCalibration"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...phCommon,
                heading: _L("quickPhCalibration"),
                instructions: _L("placeProbeInSolutionWithTemp"),
                image: "~/images/TI_13-C.jpg",
                done: _L("startTimer"),
            }),
            new WaitVisual(Wait, {
                ...phCommon,
                seconds: 120,
                heading: _L("quickPhCalibration"),
                done: _L("calibrate"),
            }),
        ]),
    ]);
};

const Ph3 = (): CalibrationStrategy => {
    const phCommon = PhCommon();

    return new CalibrationStrategy("modules.water.ph", _L("threePointCalibration"), _L("threePointCalibration"), [
        new CalibrationPointStep(new AtlasCalValue(7, PhRange, commands.PhMiddle), [
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
        new CalibrationPointStep(new AtlasCalValue(4, PhRange, commands.PhLow), [
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
        new CalibrationPointStep(new AtlasCalValue(10, PhRange, commands.PhHigh), [
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

const DissolvedOxygen = (): CalibrationStrategy => {
    const doCommon = DoCommon();

    return new CalibrationStrategy("modules.water.do", _L("waterDissolvedOxygen"), _L("waterDissolvedOxygen"), [
        new CalibrationPointStep(new AtlasCalValue(0.0, DoRange, commands.DoAtmosphere), [
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

const EcDual = (): CalibrationStrategy => {
    const ecCommon = EcCommon();

    return new CalibrationStrategy("modules.water.ec", _L("waterConductivity"), _L("waterConductivity"), [
        new CalibrationPointStep(new AtlasCalValue(0.0, EcRange, commands.EcDry), [
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
        new CalibrationPointStep(new AtlasCalValue(12880, EcRange, commands.EcSingle), [
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

export function Common(): { [index: string]: CommonProperties } {
    return {
        "modules.water.ph": PhCommon(),
        "modules.water.ec": EcCommon(),
        "modules.water.do": DoCommon(),
    };
}

export default function (): CalibrationStrategy[] {
    console.log("creating water strategies");
    return [PhQuick(), Ph3(), DissolvedOxygen(), EcDual()];
}
