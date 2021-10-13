import { CalibrationStrategy, CalibrationPointStep, CalibrationValue } from "./model";
import { CheckVisual, PrepareVisual, WaitVisual } from "./visuals";
import { _L } from "@/lib";

import Check from "./Check.vue";
import Prepare from "./Prepare.vue";
import Wait from "./Wait.vue";

type Range = [number, number];

const PhRange: Range = [0, 14];
const DoxRange: Range = [0, 40];
const EcRange: Range = [0, 1000000];
const OrpRange: Range = [-2000, 2000];
const TempRange: Range = [-200, 200];

export class CalibrationCommand {
    constructor(public readonly key: string) {}
}

const commands = {
    Ph0: new CalibrationCommand("calibration.water.ph.step0.standard"),
    Ph1: new CalibrationCommand("calibration.water.ph.step1.standard"),
    Ph2: new CalibrationCommand("calibration.water.ph.step2.standard"),

    Dox0: new CalibrationCommand("calibration.water.dox.step0.standard"),
    Dox1: new CalibrationCommand("calibration.water.dox.step1.standard"),
    Dox2: new CalibrationCommand("calibration.water.dox.step2.standard"),

    Ec0: new CalibrationCommand("calibration.water.ec.step0.standard"),
    Ec1: new CalibrationCommand("calibration.water.ec.step1.standard"),
    Ec2: new CalibrationCommand("calibration.water.ec.step2.standard"),

    Orp0: new CalibrationCommand("calibration.water.orp.step0.standard"),
    Orp1: new CalibrationCommand("calibration.water.orp.step1.standard"),
    Orp2: new CalibrationCommand("calibration.water.orp.step2.standard"),

    Temp0: new CalibrationCommand("calibration.water.temp.step0.standard"),
    Temp1: new CalibrationCommand("calibration.water.temp.step1.standard"),
    Temp2: new CalibrationCommand("calibration.water.temp.step2.standard"),
};

export class WaterCalValue extends CalibrationValue {
    constructor(
        public readonly index: number,
        public readonly reference: number,
        public readonly range: Range,
        public readonly command: CalibrationCommand
    ) {
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
        title: _L("calibration.water.ph.title"),
        subtitle: _L("calibration.water.ph.subtitle"),
        icon: "~/images/Icon_WaterpH_Module.png",
        done: _L("next"),
    };
}

function DoCommon(): CommonProperties {
    return {
        sensor: "do",
        unitOfMeasure: "mg/L",
        title: _L("calibration.water.dox.title"),
        subtitle: _L("calibration.water.dox.subtitle"),
        icon: "~/images/Icon_DissolvedOxygen_Module.png",
        done: _L("next"),
    };
}

function EcCommon(): CommonProperties {
    return {
        sensor: "ec",
        unitOfMeasure: "μS",
        title: _L("calibration.water.ec.title"),
        subtitle: _L("calibration.water.ec.subtitle"),
        icon: "~/images/Icon_WaterConductivity_Module.png",
        done: _L("next"),
    };
}

function OrpCommon(): CommonProperties {
    return {
        sensor: "orp",
        unitOfMeasure: "",
        title: _L("calibration.water.orp.title"),
        subtitle: _L("calibration.water.orp.subtitle"),
        icon: "~/images/Icon_WaterConductivity_Module.png", // WRONG
        done: _L("next"),
    };
}

function TempCommon(): CommonProperties {
    return {
        sensor: "temp",
        unitOfMeasure: "",
        title: _L("calibration.water.temp.title"),
        subtitle: _L("calibration.water.temp.subtitle"),
        icon: "~/images/Icon_WaterTemp_Module.png",
        done: _L("next"),
    };
}

const probeDipImages = [{ path: "~/images/TI_13-A.png" }, { path: "~/images/TI_13-B.png" }];

const Ph3 = (): CalibrationStrategy => {
    const phCommon = PhCommon();

    return new CalibrationStrategy(
        "modules.water.ph",
        _L("calibration.water.ph.strategy0.heading"),
        _L("calibration.water.ph.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, 4, PhRange, commands.Ph0), [
                new CheckVisual(Check, {
                    ...phCommon,
                    heading: _L("calibration.water.ph.check.heading"),
                    calibrated: _L("calibration.water.ph.check.calibrated"),
                    uncalibrated: _L("calibration.water.ph.check.uncalibrated"),
                    instructions: _L("calibration.water.ph.check.instructions"),
                    clear: _L("calibration.water.ph.check.clear"),
                    done: _L("calibration.water.ph.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _L("calibration.water.ph.step0.prepare0.heading"),
                    instructions: _L("calibration.water.ph.step0.prepare0.instructions"),
                    done: _L("calibration.water.ph.step0.prepare0.done"),
                    images: [],
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _L("calibration.water.ph.step0.prepare1.heading"),
                    instructions: _L("calibration.water.ph.step0.prepare1.instructions"),
                    done: _L("calibration.water.ph.step0.prepare1.done"),
                    images: [{ path: "~/images/TI_13-A_pH.png" }, { path: "~/images/TI_13-B_pH.png" }],
                }),
                new WaitVisual(Wait, {
                    ...phCommon,
                    seconds: 120,
                    heading: _L("calibration.water.ph.step0.calibrate.heading"),
                    done: _L("calibration.water.ph.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 7, PhRange, commands.Ph1), [
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _L("calibration.water.ph.step1.prepare0.heading"),
                    instructions: _L("calibration.water.ph.step1.prepare0.instructions"),
                    done: _L("calibration.water.ph.step1.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A_pH.png" }, { path: "~/images/TI_12-B_pH.png" }],
                }),
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _L("calibration.water.ph.step1.prepare1.heading"),
                    instructions: _L("calibration.water.ph.step1.prepare1.instructions"),
                    done: _L("calibration.water.ph.step1.prepare1.done"),
                    images: [{ path: "~/images/TI_13-A_pH.png" }, { path: "~/images/TI_13-B_pH.png" }],
                }),
                new WaitVisual(Wait, {
                    ...phCommon,
                    seconds: 120,
                    heading: _L("calibration.water.ph.step1.calibrate.heading"),
                    done: _L("calibration.water.ph.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 10, PhRange, commands.Ph2), [
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _L("calibration.water.ph.step2.prepare0.heading"),
                    instructions: _L("calibration.water.ph.step2.prepare0.instructions"),
                    done: _L("calibration.water.ph.step2.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A.png" }, { path: "~/images/TI_12-B.png" }],
                }),
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _L("calibration.water.ph.step2.prepare1.heading"),
                    instructions: _L("calibration.water.ph.step2.prepare1.instructions"),
                    done: _L("calibration.water.ph.step2.prepare1.done"),
                    images: [{ path: "~/images/TI_13-A_pH.png" }, { path: "~/images/TI_13-B_pH.png" }],
                }),
                new WaitVisual(Wait, {
                    ...phCommon,
                    seconds: 120,
                    heading: _L("calibration.water.ph.step2.calibrate.heading"),
                    done: _L("calibration.water.ph.step2.calibrate.done"),
                }),
            ]),
        ]
    );
};

const Ec3 = (): CalibrationStrategy => {
    const ecCommon = EcCommon();

    return new CalibrationStrategy(
        "modules.water.ec",
        _L("calibration.water.ec.strategy0.heading"),
        _L("calibration.water.ec.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, 1000, EcRange, commands.Ec0), [
                new CheckVisual(Check, {
                    ...ecCommon,
                    heading: _L("calibration.water.ec.check.heading"),
                    calibrated: _L("calibration.water.ec.check.calibrated"),
                    uncalibrated: _L("calibration.water.ec.check.uncalibrated"),
                    instructions: _L("calibration.water.ec.check.instructions"),
                    clear: _L("calibration.water.ec.check.clear"),
                    done: _L("calibration.water.ec.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _L("calibration.water.ec.step0.prepare0.heading"),
                    instructions: _L("calibration.water.ec.step0.prepare0.instructions"),
                    done: _L("calibration.water.ec.step0.prepare0.done"),
                    images: [],
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _L("calibration.water.ec.step0.prepare1.heading"),
                    instructions: _L("calibration.water.ec.step0.prepare1.instructions"),
                    done: _L("calibration.water.ec.step0.prepare1.done"),
                    images: [{ path: "~/images/TI_13-A_ec.png" }, { path: "~/images/TI_13-B_ec.png" }],
                }),
                new WaitVisual(Wait, {
                    ...ecCommon,
                    seconds: 120,
                    heading: _L("calibration.water.ec.step0.calibrate.heading"),
                    done: _L("calibration.water.ec.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 10000, EcRange, commands.Ec1), [
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _L("calibration.water.ec.step1.prepare0.heading"),
                    instructions: _L("calibration.water.ec.step1.prepare0.instructions"),
                    done: _L("calibration.water.ec.step1.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A_ec.png" }, { path: "~/images/TI_12-B_ec.png" }],
                }),
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _L("calibration.water.ec.step1.prepare1.heading"),
                    instructions: _L("calibration.water.ec.step1.prepare1.instructions"),
                    done: _L("calibration.water.ec.step1.prepare1.done"),
                    images: [{ path: "~/images/TI_13-A_ec.png" }, { path: "~/images/TI_13-B_ec.png" }],
                }),
                new WaitVisual(Wait, {
                    ...ecCommon,
                    seconds: 120,
                    heading: _L("calibration.water.ec.step1.calibrate.heading"),
                    done: _L("calibration.water.ec.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 100000, EcRange, commands.Ec2), [
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _L("calibration.water.ec.step2.prepare0.heading"),
                    instructions: _L("calibration.water.ec.step2.prepare0.instructions"),
                    done: _L("calibration.water.ec.step2.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A_ec.png" }, { path: "~/images/TI_12-B_ec.png" }],
                }),
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _L("calibration.water.ec.step2.prepare1.heading"),
                    instructions: _L("calibration.water.ec.step2.prepare1.instructions"),
                    done: _L("calibration.water.ec.step2.prepare1.done"),
                    images: [{ path: "~/images/TI_13-A_ec.png" }, { path: "~/images/TI_13-B_ec.png" }],
                }),
                new WaitVisual(Wait, {
                    ...ecCommon,
                    seconds: 120,
                    heading: _L("calibration.water.ec.step2.calibrate.heading"),
                    done: _L("calibration.water.ec.step2.calibrate.done"),
                }),
            ]),
        ]
    );
};

const Do3 = (): CalibrationStrategy => {
    const doxCommon = DoCommon();

    return new CalibrationStrategy(
        "modules.water.do",
        _L("calibration.water.dox.strategy0.heading"),
        _L("calibration.water.dox.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, 5, DoxRange, commands.Dox0), [
                new CheckVisual(Check, {
                    ...doxCommon,
                    heading: _L("calibration.water.dox.check.heading"),
                    calibrated: _L("calibration.water.dox.check.calibrated"),
                    uncalibrated: _L("calibration.water.dox.check.uncalibrated"),
                    instructions: _L("calibration.water.dox.check.instructions"),
                    clear: _L("calibration.water.dox.check.clear"),
                    done: _L("calibration.water.dox.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _L("calibration.water.dox.step0.prepare0.heading"),
                    instructions: _L("calibration.water.dox.step0.prepare0.instructions"),
                    done: _L("calibration.water.dox.step0.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A.png" }, { path: "~/images/TI_12-B.png" }],
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _L("calibration.water.dox.step0.prepare1.heading"),
                    instructions: _L("calibration.water.dox.step0.prepare1.instructions"),
                    done: _L("calibration.water.dox.step0.prepare1.done"),
                    images: [{ path: "~/images/TI_68_A.png" }, { path: "~/images/TI_68_B.png" }],
                }),
                new WaitVisual(Wait, {
                    ...doxCommon,
                    seconds: 120,
                    heading: _L("calibration.water.dox.step0.calibrate.heading"),
                    done: _L("calibration.water.dox.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 7.5, DoxRange, commands.Dox1), [
                /*
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _L("calibration.water.dox.step1.prepare0.heading"),
                    instructions: _L("calibration.water.dox.step1.prepare0.instructions"),
                    done: _L("calibration.water.dox.step1.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A.png" }, { path: "~/images/TI_12-B.png" }],
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _L("calibration.water.dox.step1.prepare1.heading"),
                    instructions: _L("calibration.water.dox.step1.prepare1.instructions"),
                    done: _L("calibration.water.dox.step1.prepare1.done"),
                    images: [{ path: "~/images/TI_70.png" }, { path: "~/images/TI_71.png" }],
                }),
                new WaitVisual(Wait, {
                    ...doxCommon,
                    seconds: 120,
                    heading: _L("calibration.water.dox.step1.calibrate.heading"),
                    done: _L("calibration.water.dox.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 9, DoxRange, commands.Dox2), [
                /*
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _L("calibration.water.dox.step2.prepare0.heading"),
                    instructions: _L("calibration.water.dox.step2.prepare0.instructions"),
                    done: _L("calibration.water.dox.step2.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A.png" }, { path: "~/images/TI_12-B.png" }],
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _L("calibration.water.dox.step2.prepare1.heading"),
                    instructions: _L("calibration.water.dox.step2.prepare1.instructions"),
                    done: _L("calibration.water.dox.step2.prepare1.done"),
                    images: [{ path: "~/images/TI_72.png" }, { path: "~/images/TI_73.png" }],
                }),
                new WaitVisual(Wait, {
                    ...doxCommon,
                    seconds: 120,
                    heading: _L("calibration.water.dox.step2.calibrate.heading"),
                    done: _L("calibration.water.dox.step2.calibrate.done"),
                }),
            ]),
        ]
    );
};

const Orp3 = (): CalibrationStrategy => {
    const orpCommon = OrpCommon();

    return new CalibrationStrategy(
        "modules.water.orp",
        _L("calibration.water.orp.strategy0.heading"),
        _L("calibration.water.orp.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, -100, OrpRange, commands.Orp0), [
                new CheckVisual(Check, {
                    ...orpCommon,
                    heading: _L("calibration.water.orp.check.heading"),
                    calibrated: _L("calibration.water.orp.check.calibrated"),
                    uncalibrated: _L("calibration.water.orp.check.uncalibrated"),
                    instructions: _L("calibration.water.orp.check.instructions"),
                    clear: _L("calibration.water.orp.check.clear"),
                    done: _L("calibration.water.orp.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _L("calibration.water.orp.step0.prepare0.heading"),
                    instructions: _L("calibration.water.orp.step0.prepare0.instructions"),
                    done: _L("calibration.water.orp.step0.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A.png" }, { path: "~/images/TI_12-B.png" }],
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _L("calibration.water.orp.step0.prepare1.heading"),
                    instructions: _L("calibration.water.orp.step0.prepare1.instructions"),
                    done: _L("calibration.water.orp.step0.prepare1.done"),
                    images: probeDipImages,
                }),
                new WaitVisual(Wait, {
                    ...orpCommon,
                    seconds: 120,
                    heading: _L("calibration.water.orp.step0.calibrate.heading"),
                    done: _L("calibration.water.orp.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 0, OrpRange, commands.Orp1), [
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _L("calibration.water.orp.step1.prepare0.heading"),
                    instructions: _L("calibration.water.orp.step1.prepare0.instructions"),
                    done: _L("calibration.water.orp.step1.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A.png" }, { path: "~/images/TI_12-B.png" }],
                }),
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _L("calibration.water.orp.step1.prepare1.heading"),
                    instructions: _L("calibration.water.orp.step1.prepare1.instructions"),
                    done: _L("calibration.water.orp.step1.prepare1.done"),
                    images: probeDipImages,
                }),
                new WaitVisual(Wait, {
                    ...orpCommon,
                    seconds: 120,
                    heading: _L("calibration.water.orp.step1.calibrate.heading"),
                    done: _L("calibration.water.orp.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 100, OrpRange, commands.Orp2), [
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _L("calibration.water.orp.step2.prepare0.heading"),
                    instructions: _L("calibration.water.orp.step2.prepare0.instructions"),
                    done: _L("calibration.water.orp.step2.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A.png" }, { path: "~/images/TI_12-B.png" }],
                }),
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _L("calibration.water.orp.step2.prepare1.heading"),
                    instructions: _L("calibration.water.orp.step2.prepare1.instructions"),
                    done: _L("calibration.water.orp.step2.prepare1.done"),
                    images: probeDipImages,
                }),
                new WaitVisual(Wait, {
                    ...orpCommon,
                    seconds: 120,
                    heading: _L("calibration.water.orp.step2.calibrate.heading"),
                    done: _L("calibration.water.orp.step2.calibrate.done"),
                }),
            ]),
        ]
    );
};

const Temp3 = (): CalibrationStrategy => {
    const tempCommon = TempCommon();

    return new CalibrationStrategy(
        "modules.water.temp",
        _L("calibration.water.temp.strategy0.heading"),
        _L("calibration.water.temp.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, 0, TempRange, commands.Temp0), [
                new CheckVisual(Check, {
                    ...tempCommon,
                    heading: _L("calibration.water.temp.check.heading"),
                    calibrated: _L("calibration.water.temp.check.calibrated"),
                    uncalibrated: _L("calibration.water.temp.check.uncalibrated"),
                    instructions: _L("calibration.water.temp.check.instructions"),
                    clear: _L("calibration.water.temp.check.clear"),
                    done: _L("calibration.water.temp.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _L("calibration.water.temp.step0.prepare0.heading"),
                    instructions: _L("calibration.water.temp.step0.prepare0.instructions"),
                    done: _L("calibration.water.temp.step0.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A.png" }, { path: "~/images/TI_12-B.png" }],
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _L("calibration.water.temp.step0.prepare1.heading"),
                    instructions: _L("calibration.water.temp.step0.prepare1.instructions"),
                    done: _L("calibration.water.temp.step0.prepare1.done"),
                    images: [{ path: "~/images/TI_75.png" }],
                }),
                new WaitVisual(Wait, {
                    ...tempCommon,
                    seconds: 120,
                    heading: _L("calibration.water.temp.step0.calibrate.heading"),
                    done: _L("calibration.water.temp.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 20, TempRange, commands.Temp1), [
                /*
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _L("calibration.water.temp.step1.prepare0.heading"),
                    instructions: _L("calibration.water.temp.step1.prepare0.instructions"),
                    done: _L("calibration.water.temp.step1.prepare0.done"),
                    images: [{ path: "~/images/TI_12-A.png" }],
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _L("calibration.water.temp.step1.prepare1.heading"),
                    instructions: _L("calibration.water.temp.step1.prepare1.instructions"),
                    done: _L("calibration.water.temp.step1.prepare1.done"),
                    images: [{ path: "~/images/TI_76.png" }],
                }),
                new WaitVisual(Wait, {
                    ...tempCommon,
                    seconds: 120,
                    heading: _L("calibration.water.temp.step1.calibrate.heading"),
                    done: _L("calibration.water.temp.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 100, TempRange, commands.Temp2), [
                /*
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _L("calibration.water.temp.step2.prepare0.heading"),
                    instructions: _L("calibration.water.temp.step2.prepare0.instructions"),
                    done: _L("calibration.water.temp.step2.prepare0.done"),
                    images: [],
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _L("calibration.water.temp.step2.prepare1.heading"),
                    instructions: _L("calibration.water.temp.step2.prepare1.instructions"),
                    done: _L("calibration.water.temp.step2.prepare1.done"),
                    images: [{ path: "~/images/TI_77.png" }],
                }),
                new WaitVisual(Wait, {
                    ...tempCommon,
                    seconds: 120,
                    heading: _L("calibration.water.temp.step2.calibrate.heading"),
                    done: _L("calibration.water.temp.step2.calibrate.done"),
                }),
            ]),
        ]
    );
};

export function Common(): { [index: string]: CommonProperties } {
    return {
        "modules.water.ph": PhCommon(),
        "modules.water.ec": EcCommon(),
        "modules.water.dox": DoCommon(),
        "modules.water.do": DoCommon(),
        "modules.water.orp": OrpCommon(),
        "modules.water.temp": TempCommon(),
    };
}

export default function (): CalibrationStrategy[] {
    return [Ph3(), Do3(), Ec3(), Orp3(), Temp3()];
}
