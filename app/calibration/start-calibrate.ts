import { FullRoute } from "@/routes";

import { StationCalibration, ModuleCalibration } from "./model";
import { calibrationStrategies } from "./strategies";
import { Common } from "./water";

export function makeCalibrationRoute(stationCal: StationCalibration, moduleCal: ModuleCalibration): FullRoute {
    const modulesCommon = Common();
    const moduleCommon = modulesCommon[moduleCal.moduleKey];
    if (!moduleCommon) throw new Error(`missing module common: ${moduleCal.moduleKey}`);
    const flowName = moduleCal.moduleKey.replace("modules.", "onboarding.");
    const strategies = calibrationStrategies().getModuleStrategies(moduleCal.moduleKey);
    if (!strategies.length) throw new Error(`no strategies for module: ${moduleCal.moduleKey}`);
    const strategy = strategies[0];

    return new FullRoute("reader/flow", "stations-frame", {
        flowName: flowName,
        icon: moduleCommon.icon,
        finished: new FullRoute("station/calibrate", "stations-frame", {
            stationId: stationCal.id,
            position: moduleCal.position,
            strategy: strategy,
            fromSettings: true,
        }),
        skipped: new FullRoute("station/calibrate", "stations-frame", {
            stationId: stationCal.id,
            position: moduleCal.position,
            strategy: strategy,
            fromSettings: true,
        }),
    });
}
