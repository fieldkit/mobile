<template>
    <Page @tap="tapPage">
        <template v-if="activeStep">
            <Header
                :title="activeStep.visual.title"
                :subtitle="activeStep.visual.subtitle"
                :icon="activeStep.visual.icon"
                @back="(ev) => onBack(ev, activeStep)"
            />
            <StackLayout>
                <Success v-if="cleared" text="Cleared" />
                <Success v-if="success" :text="_L('calibrated')" />
                <Failure v-if="failure" />
                <template v-if="!(success || failure) && sensor">
                    <component
                        :is="activeStep.visual.component"
                        :sensor="sensor"
                        :step="activeStep"
                        :progress="progress"
                        :busy="busy"
                        @done="() => onDone(activeStep)"
                        @back="() => onBack(activeStep)"
                        @clear="() => onClear(activeStep)"
                        @calibrate="(ref) => onCalibrate(activeStep, ref)"
                        @cancel="() => onCancel(activeStep)"
                    />
                </template>
            </StackLayout>
        </template>
    </Page>
</template>
<script lang="ts">
import _ from "lodash";
import { _T, promiseAfter, hideKeyboard } from "@/lib";

import Vue from "vue";
import Header from "./Header.vue";
import Start from "./Start.vue";
import Success from "./Success.vue";
import Failure from "./Failure.vue";

import Recalibrate from "../components/onboarding/Recalibrate.vue";
import StationSettingsModules from "../components/settings/StationSettingsModuleList.vue";

import { CalibrationStep, VisualCalibrationStep, CalibrationStrategy, CalibrationValue, CalibratingSensor } from "./model";
import { ClearWaterCalibration, CalibrateBegin, CalibrateWater } from "../store/modules/cal";
import { WaterCalValue } from "./water";

import { LegacyStation } from "@/store";

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
    data(): { success: boolean; cleared: boolean; failure: boolean; busy: boolean; completed: CalibrationStep[] } {
        return {
            success: false,
            cleared: false,
            failure: false,
            busy: false,
            completed: [],
        };
    },
    computed: {
        station(): LegacyStation | null {
            return this.$s.getters.legacyStations[this.stationId];
        },
        sensor(): CalibratingSensor | null {
            try {
                const station = this.station;
                if (!station) throw new Error(`station missing: ${this.stationId}`);

                const mod = station.modules.find((m) => m.position == this.position);
                if (!mod) throw new Error(`module missing: ${this.stationId} ${this.position} ${JSON.stringify(station.modules)}`);
                // console.log(`cal-module-full: ${JSON.stringify(mod)}`);

                const moduleId = mod.moduleId;
                const configuration = this.$s.state.cal.configurations[moduleId] || null;
                if (!configuration) throw new Error(`module configuration missing: ${this.stationId} ${this.position}`);

                const displaySensor = mod.sensors[0];
                const stationSensors = _.fromPairs(
                    _.flatten(
                        station.modules.map((mod) => {
                            return mod.sensors.map((sensor) => {
                                return [mod.name + "." + sensor.name, sensor.reading];
                            });
                        })
                    )
                ) as { [index: string]: number };

                // console.log(`cal-station-sensors: ${JSON.stringify(stationSensors)}`);

                const calibrationValue = this.strategy.getStepCalibrationValue(this.activeStep);

                return new CalibratingSensor(
                    this.stationId,
                    moduleId,
                    station.connected,
                    this.position,
                    displaySensor.unitOfMeasure,
                    displaySensor.reading,
                    displaySensor.uncalibrated,
                    calibrationValue,
                    configuration,
                    stationSensors
                );
            } catch (error) {
                console.log(`cal-error: ${error}`, error ? error.stack : null);
                return null;
            }
        },
        deviceId(): string {
            return this.$s.getters.legacyStations[this.stationId].deviceId;
        },
        activeStep(): VisualCalibrationStep {
            const step = _.first(this.getRemainingSteps());
            if (step instanceof VisualCalibrationStep) {
                return step;
            }
            return this.getLastStep();
        },
        progress(): number {
            return (this.completed.length / this.getAllVisualSteps().length) * 100;
        },
    },
    async mounted(): Promise<void> {
        const sensor = this.sensor;
        if (!sensor) throw new Error(`error: no sensor!`);

        await this.$store.dispatch(new CalibrateBegin(this.deviceId, sensor.moduleId, this.position));
    },
    methods: {
        tapPage(): void {
            hideKeyboard();
        },
        getLastStep(): VisualCalibrationStep {
            const all = this.getAllVisualSteps();
            return all[all.length - 1];
        },
        getAllVisualSteps(): VisualCalibrationStep[] {
            const steps: CalibrationStep[] = this.strategy.allChildren;
            return steps.filter((step: any): step is VisualCalibrationStep => step.visual !== undefined);
        },
        getRemainingSteps(): CalibrationStep[] {
            return _.without(this.getAllVisualSteps(), ...this.completed);
        },
        onDone(step: CalibrationStep): Promise<void> {
            this.completed.push(step);
            if (this.getRemainingSteps().length > 0) {
                return Promise.resolve();
            }
            return this.notifySuccess().then(() => {
                return this.navigateBack();
            });
        },
        onCancel(step: CalibrationStep): void {
            console.log("cal:", "cancel", step);
        },
        navigateBack(): Promise<any> {
            console.log("navigateBack", this.fromSettings);
            if (this.fromSettings) {
                return this.$navigateTo(StationSettingsModules, {
                    clearHistory: true,
                    props: {
                        stationId: this.stationId,
                    },
                });
            } else {
                return this.$navigateTo(Recalibrate, {
                    clearHistory: true,
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
        },
        onBack(step: CalibrationStep): Promise<any> {
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
            return Promise.resolve();
        },
        onClear(step: CalibrationStep): Promise<any> {
            if (!this.station || !this.station.connected) {
                return Promise.reject(new Error("station offline: no clear"));
            }
            return Promise.resolve().then(() => {
                const sensor = this.sensor;
                if (!sensor) {
                    return Promise.resolve();
                }
                const action = new ClearWaterCalibration(this.deviceId, sensor.moduleId, this.position);
                console.log("cal:", "clearing", action);
                this.busy = true;
                return this.$s
                    .dispatch(action)
                    .then(
                        (cleared) => {
                            console.log("cal:", "cleared");
                            return this.notifyCleared();
                        },
                        (err) => {
                            console.log("cal:error", err, err ? err.stack : null);
                            return this.notifyFailure();
                        }
                    )
                    .finally(() => {
                        this.busy = false;
                    });
            });
        },
        async onCalibrate(step: CalibrationStep, reference: CalibrationValue): Promise<void> {
            if (!reference) return Promise.reject(new Error("no calibration reference"));
            if (!this.station || !this.station.connected) return Promise.reject(new Error("station offline: no calibrate"));

            const sensor: CalibratingSensor | null = this.sensor;
            console.log(`cal-sensor: ${JSON.stringify(sensor)} ${JSON.stringify(reference)}`);
            if (!sensor || !sensor.moduleCalibration) {
                throw new Error(`no sensor calibration: ${JSON.stringify(sensor)}`);
            }
            const maybeWaterTemp = sensor.sensors["modules.water.temp.temp"];
            const compensations = {
                temperature: maybeWaterTemp || null,
            };
            const action = new CalibrateWater(
                this.deviceId,
                sensor.moduleId,
                this.position,
                reference as WaterCalValue,
                compensations,
                this.strategy.numberOfCalibrationPoints,
                this.strategy.curveType
            );

            console.log(`cal-action: ${JSON.stringify(action)}`);
            this.busy = true;
            await this.$s
                .dispatch(action)
                .then(
                    (calibrated) => {
                        console.log("cal:", "calibrated");
                        return this.onDone(step);
                    },
                    (err) => {
                        console.log("cal:error", err, err ? err.stack : null);
                        return this.notifyFailure();
                    }
                )
                .finally(() => {
                    this.busy = false;
                });
        },
        notifyCleared(): Promise<void> {
            this.cleared = true;
            return promiseAfter(3000).then(() => {
                this.cleared = false;
            });
        },
        notifySuccess(): Promise<void> {
            this.success = true;
            return promiseAfter(3000).then(() => {
                this.success = false;
            });
        },
        notifyFailure(): Promise<void> {
            this.failure = true;
            return promiseAfter(3000).then(() => {
                this.failure = false;
            });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
