<template>
    <Page @loaded="onPageLoaded">
        <template v-if="activeStep">
            <Header
                :title="activeStep.visual.title"
                :subtitle="activeStep.visual.subtitle"
                :icon="activeStep.visual.icon"
                @back="(ev) => onBack(ev, activeStep)"
            />
            <StackLayout>
                <Success v-if="success" />
                <Failure v-if="failure" />
                <template v-if="!(success || failure) && sensor">
                    <component
                        :is="activeStep.visual.component"
                        :sensor="sensor"
                        :step="activeStep"
                        :progress="progress"
                        @done="(ev) => onDone(ev, activeStep)"
                        @back="(ev) => onBack(ev, activeStep)"
                        @clear="(ev) => onClear(ev, activeStep)"
                        @calibrate="(ev) => onCalibrate(ev, activeStep)"
                        @cancel="(ev) => onCancel(ev, activeStep)"
                    />
                </template>
            </StackLayout>
        </template>
    </Page>
</template>
<script lang="ts">
import _ from "lodash";
import { _T } from "../utilities";
import Promise from "bluebird";

import Vue from "vue";
import Header from "./Header.vue";
import Start from "./Start.vue";
import Success from "./Success.vue";
import Failure from "./Failure.vue";

import Recalibrate from "../components/onboarding/Recalibrate.vue";
import StationSettingsModules from "../components/settings/StationSettingsModuleList.vue";

import { CalibrationStep, VisualCalibrationStep, CalibrationStrategy, CalibratingSensor } from "./model";
import { ClearAtlasCalibration, CalibrateAtlas } from "../store/modules/cal";

export default Vue.extend({
    name: "Calibrate",
    components: {
        Header,
        Success,
        Failure,
    },
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
        fromSettings: {
            default: true,
        },
    },
    data(): { success: boolean; failure: boolean; completed: CalibrationStep[] } {
        return {
            success: false,
            failure: false,
            completed: [],
        };
    },
    computed: {
        sensor(this: any): CalibratingSensor | null {
            try {
                const station = this.$store.getters.legacyStations[this.stationId];
                if (!station) throw new Error(`station missing: ${this.stationId}`);
                const module = station.modules[this.position];
                if (!module) throw new Error(`module missing: ${this.stationId} ${this.position}`);

                console.log("module-full", module);

                const moduleId = module.moduleId;

                console.log("module-id", moduleId);
                console.log("module-cal-status", this.$store.state.cal.status);

                const moduleCalibration = this.$store.state.cal.status[moduleId]?.calibration || null;
                console.log("module-cal", moduleCalibration);

                if (!moduleCalibration) throw new Error(`module calibration missing: ${this.stationId} ${this.position}`);

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

                const calibrationValue = this.strategy.getStepCalibrationValue(this.activeStep);

                console.log("cal-value", calibrationValue);

                return new CalibratingSensor(
                    this.stationId,
                    moduleId,
                    station.connected,
                    this.position,
                    displaySensor.unitOfMeasure,
                    displaySensor.reading,
                    calibrationValue,
                    moduleCalibration,
                    stationSensors
                );
            } catch (error) {
                console.log(`calibration error: ${error}`, error ? error.stack : null);
                return null;
            }
        },
        deviceId(this: any) {
            return this.$store.getters.legacyStations[this.stationId].deviceId;
        },
        activeStep(this: any): VisualCalibrationStep | null {
            const step = _.first(this.getRemainingSteps());
            if (step instanceof VisualCalibrationStep) {
                return step;
            }
            return this.getLastStep();
        },
        progress(this: any) {
            return (this.completed.length / this.getAllVisualSteps().length) * 100;
        },
    },
    methods: {
        onPageLoaded(this: any, args) {
            // console.log("cal:", "strategy", this.strategy);
        },
        getLastStep(this: any): VisualCalibrationStep {
            const all = this.getAllVisualSteps();
            return all[all.length - 1];
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
            return this.notifySuccess().then(() => {
                return this.navigateBack(ev, step);
            });
        },
        onCancel(this: any, ev: any, step: CalibrationStep) {
            console.log("cal:", "cancel", step);
        },
        navigateBack(this: any) {
            console.log("navigateBack", this.fromSettings);
            if (this.fromSettings) {
                return this.$navigateTo(StationSettingsModules, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            } else {
                return this.$navigateTo(Recalibrate, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
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
            const sensor: CalibratingSensor = this.sensor;
            const action = new ClearAtlasCalibration(this.deviceId, sensor.moduleId, this.position);
            console.log("cal:", "clearing", action);
            return this.$store.dispatch(action).then(
                (cleared) => {
                    console.log("cal:", "cleared");
                    return this.notifySuccess();
                },
                (err) => {
                    console.log("cal:error", err, err ? err.stack : null);
                    return this.notifyFailure();
                }
            );
        },
        onCalibrate(this: any, ev: any, step: CalibrationStep) {
            const sensor: CalibratingSensor = this.sensor;
            console.log("cal:", "sensor", sensor);
            if (!sensor.moduleCalibration) {
                throw new Error(`no sensor calibration: ${JSON.stringify(sensor)}`);
            }
            const maybeWaterTemp = sensor.sensors["modules.water.temp.temp"];
            const compensations = {
                temperature: maybeWaterTemp || null,
            };
            const calibrationValue = this.strategy.getStepCalibrationValue(step);
            const action = new CalibrateAtlas(
                this.deviceId,
                sensor.moduleId,
                this.position,
                sensor.moduleCalibration.type,
                calibrationValue,
                compensations
            );
            console.log("cal:", "calibrate", action);
            return this.$store.dispatch(action).then(
                (calibrated) => {
                    console.log("cal:", "calibrated");
                    return Promise.resolve(this.onDone(ev, step));
                },
                (err) => {
                    console.log("cal:error", err, err ? err.stack : null);
                    return this.notifyFailure();
                }
            );
        },
        notifySuccess(this: any) {
            this.success = true;
            return Promise.delay(3000).then(() => {
                this.success = false;
            });
        },
        notifyFailure(this: any) {
            this.failure = true;
            return Promise.delay(3000).then(() => {
                this.failure = false;
            });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
