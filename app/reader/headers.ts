import { _T } from "@/lib";

export interface ModuleHeader {
    name: string;
    icon: string;
}

export function tryFindModuleHeader(flowName: string): ModuleHeader | undefined {
    const moduleHeaders: { [index: string]: ModuleHeader } = {
        "modules.water.ph": {
            name: _T("calibration.water.ph.subtitle"),
            icon: "~/images/Icon_WaterpH_Module.png",
        },
        "modules.water.dox": {
            name: _T("calibration.water.dox.subtitle"),
            icon: "~/images/Icon_DissolvedOxygen_Module.png",
        },
        "modules.water.ec": {
            name: _T("calibration.water.ec.subtitle"),
            icon: "~/images/Icon_WaterConductivity_Module.png",
        },
        "modules.water.temp": {
            name: _T("calibration.water.temp.subtitle"),
            icon: "~/images/Icon_WaterTemp_Module.png",
        },
        "modules.water.orp": {
            name: _T("calibration.water.orp.subtitle"),
            icon: "~/images/Icon_WaterConductivity_Module.png", // WRONG
        },
        "modules.weather": {
            name: _T("modules.weather.name"),
            icon: "~/images/Icon_Weather_Module.png",
        },
    };

    const key = flowName.replace("onboarding.", "modules.");
    return moduleHeaders[key];
}
