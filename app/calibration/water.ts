import { CalibrationStrategy, CalibrationPointStep, CalibrationValue } from "./model";
import { CheckVisual, PrepareVisual, WaitVisual } from "./visuals";

import Check from "./Check.vue";
import Prepare from "./Prepare.vue";
import Wait from "./Wait.vue";

import { _T } from "../utilities";

export const PhCommon = {
    sensor: "ph",
    unitOfMeasure: "pH",
    title: _L("setup"),
    subtitle: _L("waterPh"),
    icon: "~/images/Icon_WaterpH_Module.png",
    done: _L("next"),
};

const PhQuick = new CalibrationStrategy("modules.water.ph", _L("quickCalibration"), _L("quickCalibration"), [
    new CalibrationPointStep(new CalibrationValue(7), {
        check: [
            new CheckVisual(Check, {
                ...PhCommon,
                heading: _L("quickPhCalibration"),
                done: _L("next"),
                skip: _L("skip"),
            }),
        ],
        prepare: [
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("quickPhCalibration"),
                instructions: _L("haveYourQuickSolution"),
                image: "~/images/TI_11.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("quickPhCalibration"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("quickPhCalibration"),
                instructions: _L("placeProbeInSolutionWithTemp"),
                image: "~/images/TI_13-C.jpg",
                done: _L("startTimer"),
            }),
        ],
        wait: [
            new WaitVisual(Wait, {
                ...PhCommon,
                seconds: 120,
                heading: _L("quickPhCalibration"),
                done: _L("calibrate"),
            }),
        ],
        confirm: [],
    }),
]);

const Ph3 = new CalibrationStrategy("modules.water.ph", _L("threePointCalibration"), _L("threePointCalibration"), [
    new CalibrationPointStep(new CalibrationValue(7), {
        check: [
            new CheckVisual(Check, {
                ...PhCommon,
                heading: _L("threePointCalibration"),
                done: _L("next"),
                skip: _L("skip"),
            }),
        ],
        prepare: [
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("threePointCalibration"),
                instructions: _L("makeSureYouHavePhFluids"),
                image: "~/images/TI_11_three_bottles.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("midPointCalibration"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("midPointCalibration"),
                instructions: _L("placeProbeIn7Solution"),
                image: "~/images/TI_13-C.jpg",
                done: _L("startTimer"),
            }),
        ],
        wait: [
            new WaitVisual(Wait, {
                ...PhCommon,
                seconds: 120,
                heading: _L("midPointCalibration"),
                done: _L("calibrate"),
            }),
        ],
        confirm: [],
    }),
    new CalibrationPointStep(new CalibrationValue(4), {
        check: [],
        prepare: [
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("lowPointCalibration"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("lowPointCalibration"),
                instructions: _L("placeProbeIn4Solution"),
                image: "~/images/TI_13-C.jpg",
                done: _L("startTimer"),
            }),
        ],
        wait: [
            new WaitVisual(Wait, {
                ...PhCommon,
                seconds: 120,
                heading: _L("lowPointCalibration"),
                done: _L("calibrate"),
            }),
        ],
        confirm: [],
    }),
    new CalibrationPointStep(new CalibrationValue(10), {
        check: [],
        prepare: [
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("highPointCalibration"),
                instructions: _L("rinseWithDeionizedWater"),
                image: "~/images/TI_12-A.jpg",
                done: _L("next"),
            }),
            new PrepareVisual(Prepare, {
                ...PhCommon,
                heading: _L("highPointCalibration"),
                instructions: _L("placeProbeIn10Solution"),
                image: "~/images/TI_13-C.jpg",
                done: _L("startTimer"),
            }),
        ],
        wait: [
            new WaitVisual(Wait, {
                ...PhCommon,
                seconds: 120,
                heading: _L("highPointCalibration"),
                done: _L("calibrate"),
            }),
        ],
        confirm: [],
    }),
]);

export default [PhQuick, Ph3];
