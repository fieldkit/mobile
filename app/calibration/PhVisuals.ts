import { CalibrationVisual } from "./visuals";

import Move from "./Move.vue";
import DipInSolution from "./DipInSolution.vue";
import Wait from "./Wait.vue";
import Confirm from "./Confirm.vue";

export default {
    middle: {
        move: [new CalibrationVisual(Move), new CalibrationVisual(DipInSolution)],
        wait: [new CalibrationVisual(Wait)],
        confirm: [new CalibrationVisual(Confirm)],
    },
    low: {
        move: [new CalibrationVisual(Move), new CalibrationVisual(DipInSolution)],
        wait: [new CalibrationVisual(Wait)],
        confirm: [new CalibrationVisual(Confirm)],
    },
    high: {
        move: [new CalibrationVisual(Move), new CalibrationVisual(DipInSolution)],
        wait: [new CalibrationVisual(Wait)],
        confirm: [new CalibrationVisual(Confirm)],
    },
};
