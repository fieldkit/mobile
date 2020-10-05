import { CalibrationStrategies } from "./model";

import Water from "./water";

let strategies: CalibrationStrategies | null = null;

export function calibrationStrategies(): CalibrationStrategies {
    if (!strategies) {
        strategies = new CalibrationStrategies(Water());
    }
    return strategies;
}
