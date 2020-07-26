import _ from "lodash";
import Vue from "../wrappers/vue";
import { _T } from "../utilities";
import { CalibrationStep, VisualCalibrationStep, CalibrationStrategy } from "./model";
import { CalibrationVisual } from "./visuals";

export default Vue.extend({
    props: {
        strategy: {
            type: CalibrationStrategy,
            required: true,
        },
    },
    data(): { completed: CalibrationStep[] } {
        return {
            completed: [],
        };
    },
    computed: {
        activeStep(this: any): VisualCalibrationStep {
            const step = _.first(_.without(this.getAllVisualSteps(), ...this.completed));
            if (step instanceof VisualCalibrationStep) {
                console.log("active", step, "completed", this.completed);
                return step;
            }
            throw new Error("no active step");
        },
        activeVisual(this: any): CalibrationVisual {
            return this.activeStep.visual;
        },
    },
    methods: {
        getAllVisualSteps(this: any): VisualCalibrationStep[] {
            const steps: CalibrationStep[] = this.strategy.allChildren;
            return steps.filter((step: any): step is VisualCalibrationStep => step.visual !== undefined);
        },
        onPageLoaded(this: any, args) {
            console.log("cal:", "strategy", this.strategy);
        },
        onDone(this: any, ev: any, step: CalibrationStep) {
            this.completed.push(step);
            console.log("cal:", "done", step);
            console.log("cal:", "completed:", this.completed);
            console.log("cal:", "visuals-left:", _.without(this.getAllVisualSteps(), ...this.completed));
            console.log("cal:", this.getAllVisualSteps()[0], this.activeStep, this.getAllVisualSteps()[0] == this.activeStep);
        },
        onCancel(this: any, ev: any, step: CalibrationStep) {
            console.log("cal:", "cancel", step);
        },
    },
});
