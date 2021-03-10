import { CalibrationStrategy, CalibrationPointStep, CalibrationValue } from "./model";
import { CheckVisual, PrepareVisual, WaitVisual } from "./visuals";
import { _T } from "@/lib";

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
        title: _T("calibration.water.ph.title"),
        subtitle: _T("calibration.water.ph.subtitle"),
        icon: "~/images/Icon_WaterpH_Module.png",
        done: _T("next"),
    };
}

function DoCommon(): CommonProperties {
    return {
        sensor: "do",
        unitOfMeasure: "mg/L",
        title: _T("calibration.water.dox.title"),
        subtitle: _T("calibration.water.dox.subtitle"),
        icon: "~/images/Icon_DissolvedOxygen_Module.png",
        done: _T("next"),
    };
}

function EcCommon(): CommonProperties {
    return {
        sensor: "ec",
        unitOfMeasure: "μS",
        title: _T("calibration.water.ec.title"),
        subtitle: _T("calibration.water.ec.subtitle"),
        icon: "~/images/Icon_WaterConductivity_Module.png",
        done: _T("next"),
    };
}

function OrpCommon(): CommonProperties {
    return {
        sensor: "orp",
        unitOfMeasure: "",
        title: _T("calibration.water.orp.title"),
        subtitle: _T("calibration.water.orp.subtitle"),
        icon: "~/images/Icon_WaterConductivity_Module.png", // WRONG
        done: _T("next"),
    };
}

function TempCommon(): CommonProperties {
    return {
        sensor: "temp",
        unitOfMeasure: "",
        title: _T("calibration.water.temp.title"),
        subtitle: _T("calibration.water.temp.subtitle"),
        icon: "~/images/Icon_WaterConductivity_Module.png", // WRONG
        done: _T("next"),
    };
}

const Ph3 = (): CalibrationStrategy => {
    const phCommon = PhCommon();

    return new CalibrationStrategy(
        "modules.water.ph",
        _T("calibration.water.ph.strategy0.heading"),
        _T("calibration.water.ph.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, 4, PhRange, commands.Ph0), [
                new CheckVisual(Check, {
                    ...phCommon,
                    heading: _T("calibration.water.ph.check.heading"),
                    calibrated: _T("calibration.water.ph.check.calibrated"),
                    uncalibrated: _T("calibration.water.ph.check.uncalibrated"),
                    instructions: _T("calibration.water.ph.check.instructions"),
                    clear: _T("calibration.water.ph.check.clear"),
                    done: _T("calibration.water.ph.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _T("calibration.water.ph.step0.prepare0.heading"),
                    instructions: _T("calibration.water.ph.step0.prepare0.instructions"),
                    done: _T("calibration.water.ph.step0.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _T("calibration.water.ph.step0.prepare1.heading"),
                    instructions: _T("calibration.water.ph.step0.prepare1.instructions"),
                    done: _T("calibration.water.ph.step0.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...phCommon,
                    seconds: 120,
                    heading: _T("calibration.water.ph.step0.calibrate.heading"),
                    done: _T("calibration.water.ph.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 7, PhRange, commands.Ph1), [
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _T("calibration.water.ph.step1.prepare0.heading"),
                    instructions: _T("calibration.water.ph.step1.prepare0.instructions"),
                    done: _T("calibration.water.ph.step1.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _T("calibration.water.ph.step1.prepare1.heading"),
                    instructions: _T("calibration.water.ph.step1.prepare1.instructions"),
                    done: _T("calibration.water.ph.step1.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...phCommon,
                    seconds: 120,
                    heading: _T("calibration.water.ph.step1.calibrate.heading"),
                    done: _T("calibration.water.ph.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 10, PhRange, commands.Ph2), [
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _T("calibration.water.ph.step2.prepare0.heading"),
                    instructions: _T("calibration.water.ph.step2.prepare0.instructions"),
                    done: _T("calibration.water.ph.step2.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
                new PrepareVisual(Prepare, {
                    ...phCommon,
                    heading: _T("calibration.water.ph.step2.prepare1.heading"),
                    instructions: _T("calibration.water.ph.step2.prepare1.instructions"),
                    done: _T("calibration.water.ph.step2.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...phCommon,
                    seconds: 120,
                    heading: _T("calibration.water.ph.step2.calibrate.heading"),
                    done: _T("calibration.water.ph.step2.calibrate.done"),
                }),
            ]),
        ]
    );
};

const Ec3 = (): CalibrationStrategy => {
    const ecCommon = EcCommon();

    return new CalibrationStrategy(
        "modules.water.ec",
        _T("calibration.water.ec.strategy0.heading"),
        _T("calibration.water.ec.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, 1000, EcRange, commands.Ec0), [
                new CheckVisual(Check, {
                    ...ecCommon,
                    heading: _T("calibration.water.ec.check.heading"),
                    calibrated: _T("calibration.water.ec.check.calibrated"),
                    uncalibrated: _T("calibration.water.ec.check.uncalibrated"),
                    instructions: _T("calibration.water.ec.check.instructions"),
                    clear: _T("calibration.water.ec.check.clear"),
                    done: _T("calibration.water.ec.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _T("calibration.water.ec.step0.prepare0.heading"),
                    instructions: _T("calibration.water.ec.step0.prepare0.instructions"),
                    done: _T("calibration.water.ec.step0.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _T("calibration.water.ec.step0.prepare1.heading"),
                    instructions: _T("calibration.water.ec.step0.prepare1.instructions"),
                    done: _T("calibration.water.ec.step0.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...ecCommon,
                    seconds: 120,
                    heading: _T("calibration.water.ec.step0.calibrate.heading"),
                    done: _T("calibration.water.ec.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 10000, EcRange, commands.Ec1), [
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _T("calibration.water.ec.step1.prepare0.heading"),
                    instructions: _T("calibration.water.ec.step1.prepare0.instructions"),
                    done: _T("calibration.water.ec.step1.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _T("calibration.water.ec.step1.prepare1.heading"),
                    instructions: _T("calibration.water.ec.step1.prepare1.instructions"),
                    done: _T("calibration.water.ec.step1.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...ecCommon,
                    seconds: 120,
                    heading: _T("calibration.water.ec.step1.calibrate.heading"),
                    done: _T("calibration.water.ec.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 100000, EcRange, commands.Ec2), [
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _T("calibration.water.ec.step2.prepare0.heading"),
                    instructions: _T("calibration.water.ec.step2.prepare0.instructions"),
                    done: _T("calibration.water.ec.step2.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
                new PrepareVisual(Prepare, {
                    ...ecCommon,
                    heading: _T("calibration.water.ec.step2.prepare1.heading"),
                    instructions: _T("calibration.water.ec.step2.prepare1.instructions"),
                    done: _T("calibration.water.ec.step2.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...ecCommon,
                    seconds: 120,
                    heading: _T("calibration.water.ec.step2.calibrate.heading"),
                    done: _T("calibration.water.ec.step2.calibrate.done"),
                }),
            ]),
        ]
    );
};

const Do3 = (): CalibrationStrategy => {
    const doxCommon = DoCommon();

    return new CalibrationStrategy(
        "modules.water.dox",
        _T("calibration.water.dox.strategy0.heading"),
        _T("calibration.water.dox.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, 5, DoxRange, commands.Dox0), [
                new CheckVisual(Check, {
                    ...doxCommon,
                    heading: _T("calibration.water.dox.check.heading"),
                    calibrated: _T("calibration.water.dox.check.calibrated"),
                    uncalibrated: _T("calibration.water.dox.check.uncalibrated"),
                    instructions: _T("calibration.water.dox.check.instructions"),
                    clear: _T("calibration.water.dox.check.clear"),
                    done: _T("calibration.water.dox.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _T("calibration.water.dox.step0.prepare0.heading"),
                    instructions: _T("calibration.water.dox.step0.prepare0.instructions"),
                    done: _T("calibration.water.dox.step0.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _T("calibration.water.dox.step0.prepare1.heading"),
                    instructions: _T("calibration.water.dox.step0.prepare1.instructions"),
                    done: _T("calibration.water.dox.step0.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...doxCommon,
                    seconds: 120,
                    heading: _T("calibration.water.dox.step0.calibrate.heading"),
                    done: _T("calibration.water.dox.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 7.5, DoxRange, commands.Dox1), [
                /*
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _T("calibration.water.dox.step1.prepare0.heading"),
                    instructions: _T("calibration.water.dox.step1.prepare0.instructions"),
                    done: _T("calibration.water.dox.step1.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _T("calibration.water.dox.step1.prepare1.heading"),
                    instructions: _T("calibration.water.dox.step1.prepare1.instructions"),
                    done: _T("calibration.water.dox.step1.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...doxCommon,
                    seconds: 120,
                    heading: _T("calibration.water.dox.step1.calibrate.heading"),
                    done: _T("calibration.water.dox.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 9, DoxRange, commands.Dox2), [
                /*
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _T("calibration.water.dox.step2.prepare0.heading"),
                    instructions: _T("calibration.water.dox.step2.prepare0.instructions"),
                    done: _T("calibration.water.dox.step2.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...doxCommon,
                    heading: _T("calibration.water.dox.step2.prepare1.heading"),
                    instructions: _T("calibration.water.dox.step2.prepare1.instructions"),
                    done: _T("calibration.water.dox.step2.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...doxCommon,
                    seconds: 120,
                    heading: _T("calibration.water.dox.step2.calibrate.heading"),
                    done: _T("calibration.water.dox.step2.calibrate.done"),
                }),
            ]),
        ]
    );
};

const Orp3 = (): CalibrationStrategy => {
    const orpCommon = OrpCommon();

    return new CalibrationStrategy(
        "modules.water.orp",
        _T("calibration.water.orp.strategy0.heading"),
        _T("calibration.water.orp.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, -100, OrpRange, commands.Orp0), [
                new CheckVisual(Check, {
                    ...orpCommon,
                    heading: _T("calibration.water.orp.check.heading"),
                    calibrated: _T("calibration.water.orp.check.calibrated"),
                    uncalibrated: _T("calibration.water.orp.check.uncalibrated"),
                    instructions: _T("calibration.water.orp.check.instructions"),
                    clear: _T("calibration.water.orp.check.clear"),
                    done: _T("calibration.water.orp.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _T("calibration.water.orp.step0.prepare0.heading"),
                    instructions: _T("calibration.water.orp.step0.prepare0.instructions"),
                    done: _T("calibration.water.orp.step0.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _T("calibration.water.orp.step0.prepare1.heading"),
                    instructions: _T("calibration.water.orp.step0.prepare1.instructions"),
                    done: _T("calibration.water.orp.step0.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...orpCommon,
                    seconds: 120,
                    heading: _T("calibration.water.orp.step0.calibrate.heading"),
                    done: _T("calibration.water.orp.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 0, OrpRange, commands.Orp1), [
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _T("calibration.water.orp.step1.prepare0.heading"),
                    instructions: _T("calibration.water.orp.step1.prepare0.instructions"),
                    done: _T("calibration.water.orp.step1.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _T("calibration.water.orp.step1.prepare1.heading"),
                    instructions: _T("calibration.water.orp.step1.prepare1.instructions"),
                    done: _T("calibration.water.orp.step1.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...orpCommon,
                    seconds: 120,
                    heading: _T("calibration.water.orp.step1.calibrate.heading"),
                    done: _T("calibration.water.orp.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 100, OrpRange, commands.Orp2), [
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _T("calibration.water.orp.step2.prepare0.heading"),
                    instructions: _T("calibration.water.orp.step2.prepare0.instructions"),
                    done: _T("calibration.water.orp.step2.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
                new PrepareVisual(Prepare, {
                    ...orpCommon,
                    heading: _T("calibration.water.orp.step2.prepare1.heading"),
                    instructions: _T("calibration.water.orp.step2.prepare1.instructions"),
                    done: _T("calibration.water.orp.step2.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...orpCommon,
                    seconds: 120,
                    heading: _T("calibration.water.orp.step2.calibrate.heading"),
                    done: _T("calibration.water.orp.step2.calibrate.done"),
                }),
            ]),
        ]
    );
};

const Temp3 = (): CalibrationStrategy => {
    const tempCommon = TempCommon();

    return new CalibrationStrategy(
        "modules.water.temp",
        _T("calibration.water.temp.strategy0.heading"),
        _T("calibration.water.temp.strategy0.help"),
        [
            new CalibrationPointStep(new WaterCalValue(0, 0, TempRange, commands.Temp0), [
                new CheckVisual(Check, {
                    ...tempCommon,
                    heading: _T("calibration.water.temp.check.heading"),
                    calibrated: _T("calibration.water.temp.check.calibrated"),
                    uncalibrated: _T("calibration.water.temp.check.uncalibrated"),
                    instructions: _T("calibration.water.temp.check.instructions"),
                    clear: _T("calibration.water.temp.check.clear"),
                    done: _T("calibration.water.temp.check.done"),
                }),
                /*
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _T("calibration.water.temp.step0.prepare0.heading"),
                    instructions: _T("calibration.water.temp.step0.prepare0.instructions"),
                    done: _T("calibration.water.temp.step0.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _T("calibration.water.temp.step0.prepare1.heading"),
                    instructions: _T("calibration.water.temp.step0.prepare1.instructions"),
                    done: _T("calibration.water.temp.step0.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...tempCommon,
                    seconds: 120,
                    heading: _T("calibration.water.temp.step0.calibrate.heading"),
                    done: _T("calibration.water.temp.step0.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(1, 20, TempRange, commands.Temp1), [
                /*
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _T("calibration.water.temp.step1.prepare0.heading"),
                    instructions: _T("calibration.water.temp.step1.prepare0.instructions"),
                    done: _T("calibration.water.temp.step1.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _T("calibration.water.temp.step1.prepare1.heading"),
                    instructions: _T("calibration.water.temp.step1.prepare1.instructions"),
                    done: _T("calibration.water.temp.step1.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...tempCommon,
                    seconds: 120,
                    heading: _T("calibration.water.temp.step1.calibrate.heading"),
                    done: _T("calibration.water.temp.step1.calibrate.done"),
                }),
            ]),
            new CalibrationPointStep(new WaterCalValue(2, 100, TempRange, commands.Temp2), [
                /*
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _T("calibration.water.temp.step2.prepare0.heading"),
                    instructions: _T("calibration.water.temp.step2.prepare0.instructions"),
                    done: _T("calibration.water.temp.step2.prepare0.done"),
                    image: "~/images/TI_12-A.jpg",
                }),
				*/
                new PrepareVisual(Prepare, {
                    ...tempCommon,
                    heading: _T("calibration.water.temp.step2.prepare1.heading"),
                    instructions: _T("calibration.water.temp.step2.prepare1.instructions"),
                    done: _T("calibration.water.temp.step2.prepare1.done"),
                    image: "~/images/TI_13-C.jpg",
                }),
                new WaitVisual(Wait, {
                    ...tempCommon,
                    seconds: 120,
                    heading: _T("calibration.water.temp.step2.calibrate.heading"),
                    done: _T("calibration.water.temp.step2.calibrate.done"),
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
