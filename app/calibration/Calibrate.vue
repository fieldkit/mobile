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
                @clear="(ev) => onClear(ev, activeStep)"
                @calibrate="(ev) => onCalibrate(ev, activeStep)"
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
import { ClearAtlasCalibration, CalibrateAtlas } from "../store/modules/cal";

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
            const station = this.$store.getters.legacyStations[this.stationId];
            if (!station) throw new Error(`station missing: ${this.stationId}`);
            const module = station.modules[this.position];
            if (!module) throw new Error(`module missing: ${this.stationId} ${this.position}`);

            console.log("module-full", module);

            const moduleId = module.moduleId;
            console.log("module-id", moduleId);

            const calibration = this.$store.state.cal.status[moduleId]?.calibration || null;
            console.log("module-status", calibration);

            const displaySensor = module.sensors[0];
            const stationSensors = _.fromPairs(
                _.flatten(
                    station.modules.map((module) => {
                        return module.sensors.map((sensor) => {
                            return [module.name + "." + sensor.name, sensor.reading];
                        });
                    })
                )
            ) as { [index: string]: number };

            console.log("station-sensors", stationSensors);

            return new CalibratingSensor(
                this.stationId,
                moduleId,
                station.connected,
                this.position,
                displaySensor.unitOfMeasure,
                displaySensor.reading,
                calibration,
                stationSensors
            );
        },
        deviceId(this: any) {
            return this.$store.getters.legacyStations[this.stationId].deviceId;
        },
        activeStep(this: any): VisualCalibrationStep {
            const step = _.first(this.getRemainingSteps());
            if (step instanceof VisualCalibrationStep) {
                return step;
            }
            // TODO Maybe remove, since this clutters logs on our exiting.
            throw new Error("no active step");
        },
        activeVisual(this: any): CalibrationVisual {
            return this.activeStep.visual;
        },
        progress(this: any) {
            return (this.completed.length / this.getAllVisualSteps().length) * 100;
        },
    },
    methods: {
        onPageLoaded(this: any, args) {
            // console.log("cal:", "strategy", this.strategy);
        },
        getAllVisualSteps(this: any): VisualCalibrationStep[] {
            const steps: CalibrationStep[] = this.strategy.allChildren;
            return steps.filter((step: any): step is VisualCalibrationStep => step.visual !== undefined);
        },
        getRemainingSteps(this: any): VisualCalibrationStep[] {
            return _.without(this.getAllVisualSteps(), ...this.completed);
        },
        onDone(this: any, ev: any, step: CalibrationStep) {
            this.completed.push(step);
            console.log("cal:", "done", step);
            if (this.getRemainingSteps().length > 0) {
                return;
            }

            console.log("cal", "finished");
            return this.$navigateTo(Start, {
                props: {
                    stationId: this.stationId,
                    position: this.position,
                },
            });
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
        onClear(this: any, ev: any, step: CalibrationStep) {
            const sensor = this.sensor;
            const action = new ClearAtlasCalibration(this.deviceId, sensor.moduleId, this.position);
            console.log("cal:", "clearing", action);
            return this.$store.dispatch(action).then((cleared) => {
                console.log("cal:", "cleared");
            });
        },
        onCalibrate(this: any, ev: any, step: CalibrationStep) {
            const sensor = this.sensor;
            const maybeWaterTemp = sensor.sensors["modules.water.temp.temp"];
            const compensations = {
                temperature: maybeWaterTemp || null,
            };
            const calibrationValue = this.strategy.getStepCalibrationValue(step);
            const action = new CalibrateAtlas(this.deviceId, sensor.moduleId, this.position, calibrationValue, compensations);
            console.log("cal:", "calibrate", action);
            return this.$store.dispatch(action).then((calibrated) => {
                console.log("cal:", "calibrated");
                return this.onDone(ev, step);
            });
        },
    },
});
</script>
<style scoped lang="scss">
@import "../app-variables";
</style>
