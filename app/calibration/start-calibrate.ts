import _ from "lodash";
import { FullRoute } from "@/routes";

import { StationCalibration, ModuleCalibration } from "./model";
import { calibrationStrategies } from "./strategies";
import { Common } from "./water";

import { getFlows, getFlowNames } from "@/reader";

export async function makeCalibrationRoute(stationCal: StationCalibration, moduleCal: ModuleCalibration): Promise<FullRoute> {
    const modulesCommon = Common();
    const moduleCommon = modulesCommon[moduleCal.moduleKey];
    if (!moduleCommon) throw new Error(`missing module common: ${moduleCal.moduleKey}`);
    const strategies = calibrationStrategies().getModuleStrategies(moduleCal.moduleKey);
    if (!strategies.length) throw new Error(`no strategies for module: ${moduleCal.moduleKey}`);
    const strategy = strategies[0];

    const flows = await getFlows();
    const flowNames = getFlowNames(flows);

    const flowName = moduleCal.moduleKey.replace("modules.", "onboarding.");
    const hasFlow = _.includes(flowNames, flowName);

    const calibrateRoute = new FullRoute("station/calibrate", "stations-frame", {
        stationId: stationCal.id,
        position: moduleCal.position,
        strategy: strategy,
        fromSettings: true,
    });

    if (!hasFlow) {
        return calibrateRoute;
    }

    return new FullRoute("reader/flow", "stations-frame", {
        flowName: flowName,
        icon: moduleCommon.icon,
        finished: calibrateRoute,
        skipped: calibrateRoute,
    });
}
