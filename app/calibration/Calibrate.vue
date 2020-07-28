<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <component
                :is="activeVisual.component"
                :sensor="sensor"
                :step="activeStep"
                :visual="activeVisual"
                :progress="progress"
                @done="(ev) => onDone(ev, activeStep)"
                @back="(ev) => onBack(ev, activeStep)"
                @cancel="(ev) => onCancel(ev, activeStep)"
            />
        </StackLayout>
    </Page>
</template>
<script lang="ts">
import _ from "lodash";
import { _T } from "../utilities";

import Vue from "../wrappers/vue";
import Start from "./Start";

import { CalibrationStep, VisualCalibrationStep, CalibrationStrategy, CalibratingSensor } from "./model";
import { CalibrationVisual } from "./visuals";
// import { ClearAtlasCalibration } from "../store/modules/cal";

export default Vue.extend({
    name: "Calibrate",
    components: {},
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        position: {
            type: Number,
            required: true,
        },
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
        sensor(this: any) {
            const station = this.$store.getters.stationsById[this.stationId];
            return new CalibratingSensor(this.stationId, station.connected, this.position, "ph", 6.87, {});
        },
        deviceId(this: any) {
            return this.$store.getters.legacyStations[this.stationId].deviceId;
        },
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
        progress(this: any) {
            return (this.completed.length / this.getAllVisualSteps().length) * 100;
        },
    },
    mounted() {
        /*
        const action = new ClearAtlasCalibration(this.deviceId, 1);
        return this.$store.dispatch(action).then((cleared) => {
            console.log("clear done", cleared);
        });
		*/
    },
    methods: {
        onPageLoaded(this: any, args) {
            // console.log("cal:", "strategy", this.strategy);
        },
        getAllVisualSteps(this: any): VisualCalibrationStep[] {
            const steps: CalibrationStep[] = this.strategy.allChildren;
            return steps.filter((step: any): step is VisualCalibrationStep => step.visual !== undefined);
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
            if (this.completed.length == 0) {
                return this.$navigateTo(Start, {
                    props: {
                        stationId: this.stationId,
                        position: this.position,
                    },
                });
            }
            this.completed = _.without(this.completed, this.completed[this.completed.length - 1]);
        },
    },
});
</script>
<style scoped lang="scss">
@import "../app-variables";
</style>
