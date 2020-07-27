<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <component
                :is="activeVisual.component"
                :step="activeStep"
                :visual="activeVisual"
                @done="(ev) => onDone(ev, activeStep)"
                @back="(ev) => onBack(ev, activeStep)"
                @cancel="(ev) => onCancel(ev, activeStep)"
            />
        </StackLayout>
    </Page>
</template>
<script lang="ts">
import _ from "lodash";
import Vue from "../wrappers/vue";
import { _T } from "../utilities";
import { CalibrationStep, VisualCalibrationStep, CalibrationStrategy } from "./model";
import { CalibrationVisual } from "./visuals";

export default Vue.extend({
    name: "Calibrate",
    components: {},
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
        },
        onCancel(this: any, ev: any, step: CalibrationStep) {
            console.log("cal:", "cancel", step);
        },
        onBack(this: any, ev: any, step: CalibrationStep) {
            console.log("cal:", "back", step, "completed", this.completed.length);
            if (this.completed.length > 0) {
                this.completed = _.without(this.completed, this.completed[this.completed.length - 1]);
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "../app-variables";
</style>
