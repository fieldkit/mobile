import { CalibrationStrategy, CalibrationPointStep, CalibrationValue } from "./model";
import { CheckVisual, PrepareVisual, WaitVisual } from "./visuals";

import protobuf from "protobufjs";

import Check from "./Check.vue";
import Prepare from "./Prepare.vue";
import Wait from "./Wait.vue";

// TODO Pull this along with calibrate-service boilerplate into a TS wrapper.
const atlasRoot: any = protobuf.Root.fromJSON(require("fk-atlas-protocol"));
const DoCalibrateCommand = atlasRoot.lookup("fk_atlas.DoCalibrateCommand");
const PhCalibrateCommand = atlasRoot.lookup("fk_atlas.PhCalibrateCommand");
const EcCalibrateCommand = atlasRoot.lookup("fk_atlas.EcCalibrateCommand");
// const TempCalibrateCommand = atlasRoot.lookup("fk_atlas.TempCalibrateCommand");
// const OrpCalibrateCommand = atlasRoot.lookup("fk_atlas.OrpCalibrateCommand");

export class AtlasCalValue extends CalibrationValue {
    constructor(public readonly reference: number, public readonly which: number) {
        super();
    }
}

interface CommonProperties {
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

const PhQuick = () => {
    const phCommon = PhCommon();

    return new CalibrationStrategy("modules.water.ph", _L("quickCalibration"), _L("quickCalibration"), [
        new CalibrationPointStep(new AtlasCalValue(6.86, PhCalibrateCommand.values.CALIBRATE_PH_MIDDLE), [
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

const Ph3 = () => {
    const phCommon = PhCommon();

    return new CalibrationStrategy("modules.water.ph", _L("threePointCalibration"), _L("threePointCalibration"), [
        new CalibrationPointStep(new AtlasCalValue(7, PhCalibrateCommand.values.CALIBRATE_PH_MIDDLE), [
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
        new CalibrationPointStep(new AtlasCalValue(4, PhCalibrateCommand.values.CALIBRATE_PH_LOW), [
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
        new CalibrationPointStep(new AtlasCalValue(10, PhCalibrateCommand.values.CALIBRATE_PH_HIGH), [
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

const DissolvedOxygen = () => {
    const doCommon = DoCommon();

    return new CalibrationStrategy("modules.water.do", _L("waterDissolvedOxygen"), _L("waterDissolvedOxygen"), [
        new CalibrationPointStep(new AtlasCalValue(0.0, DoCalibrateCommand.values.CALIBRATE_DO_ATMOSPHERE), [
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

const EcDual = () => {
    const ecCommon = EcCommon();

    return new CalibrationStrategy("modules.water.ec", _L("waterConductivity"), _L("waterConductivity"), [
        new CalibrationPointStep(new AtlasCalValue(0.0, EcCalibrateCommand.values.CALIBRATE_EC_DRY), [
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
        new CalibrationPointStep(new AtlasCalValue(12880, EcCalibrateCommand.values.CALIBRATE_EC_SINGLE), [
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

export default function () {
    console.log("creating water strategies");
    return [PhQuick(), Ph3(), DissolvedOxygen(), EcDual()];
}
