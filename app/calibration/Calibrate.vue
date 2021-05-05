<template>
    <Page @tap="tapPage" @navigatingFrom="onNavigatingFrom" @navigatingTo="onNavigatingTo">
        <template v-if="activeStep">
            <Header
                :title="activeStep.visual.title"
                :subtitle="activeStep.visual.subtitle"
                :icon="activeStep.visual.icon"
                @back="() => onBack(activeStep)"
            />
            <StackLayout>
                <Success v-if="cleared" :text="_L('calibration.cleared')" />
                <Success v-if="success" :text="_L('calibration.calibrated')" />
                <Failure v-if="failure" @try-again="tryAgain" @skip="skip" :moduleId="sensor.moduleId" />
                <template v-if="!(success || failure) && sensor && !done">
                    <component
                        :is="activeStep.visual.component"
                        :sensor="sensor"
                        :step="activeStep"
                        :progress="progress"
                        :busy="busy"
                        @done="(ignore) => onDone(activeStep, ignore || false)"
                        @back="() => onBack(activeStep)"
                        @clear="() => onClear(activeStep)"
                        @calibrate="(ref) => onCalibrate(activeStep, ref)"
                    />
                </template>
            </StackLayout>
        </template>
    </Page>
</template>
<script lang="ts">
import _ from "lodash";
import { promiseAfter, hideKeyboard } from "@/lib";

import Vue from "vue";
import Header from "./Header.vue";
import Success from "./Success.vue";
import Failure from "./Failure.vue";

import { CalibrationStep, VisualCalibrationStep, CalibrationStrategy, CalibrationValue, CalibratingSensor } from "./model";
import { ClearWaterCalibration, CalibrateBegin, CalibrateWater } from "../store/modules/cal";
import { WaterCalValue } from "./water";

import { LegacyStation } from "@/store";
import { navigateBackToBookmark } from "@/routes";

import { keepAwake, allowSleepAgain } from "@nativescript-community/insomnia";

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
    data(): {
        success: boolean;
        cleared: boolean;
        failure: boolean;
        busy: boolean;
        done: boolean;
        ignored: CalibrationStep[];
        completed: CalibrationStep[];
    } {
        return {
            success: false,
            cleared: false,
            failure: false,
            busy: false,
            done: false,
            ignored: [],
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

                // HACK Right now unitOfMeasure in the firmware is blank for pH. This can go away eventually.
                const getUoM = () => {
                    if (displaySensor.name == "ph") {
                        return "pH";
                    }
                    return displaySensor.unitOfMeasure;
                };

                return new CalibratingSensor(
                    this.stationId,
                    moduleId,
                    station.connected,
                    this.position,
                    getUoM(),
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
        getTotalSteps(): number {
            return this.getAllVisualSteps().length;
        },
        async onDone(step: CalibrationStep, ignoreNav: boolean = true): Promise<void> {
            console.log("cal:", "done", this.completed.length, "+1", this.getTotalSteps());
            if (ignoreNav) {
                this.ignored.push(step);
            }

            this.completed.push(step);

            if (this.completed.length < this.getTotalSteps()) {
                console.log("cal: !has-total-steps");
                return;
            }

            if (this.getRemainingSteps().length > 0) {
                console.log("cal: !has-more-steps");
                return;
            }

            await this.notifySuccess();

            await navigateBackToBookmark(this, "stations-frame");
        },
        async skip(): Promise<void> {
            console.log("cal:", "skip", this.fromSettings);

            await navigateBackToBookmark(this, "stations-frame");
        },
        async navigateBack(): Promise<void> {
            console.log("cal:", "navigate-back", this.fromSettings);
            await this.$navigateBack();
        },
        async onBack(step: CalibrationStep): Promise<void> {
            const remaining = _.without(this.completed, ...this.ignored);
            console.log("cal:", "remaining", remaining.length, "completed", this.completed.length, "ignored", this.ignored.length);
            if (remaining.length == 0) {
                await this.navigateBack();
            }

            this.completed = _.without(this.completed, this.completed[this.completed.length - 1]);
            console.log("cal:", "back", "completed", this.completed.length);
            return Promise.resolve();
        },
        async onClear(step: CalibrationStep): Promise<void> {
            if (!this.station || !this.station.connected) {
                return Promise.reject(new Error("station offline: no clear"));
            }

            const sensor = this.sensor;
            if (!sensor) {
                return Promise.resolve();
            }
            const action = new ClearWaterCalibration(this.deviceId, sensor.moduleId, this.position);
            console.log("cal:", "clearing", action);
            this.busy = true;
            await this.$s
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

            await this.onDone(this.activeStep);
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
        async tryAgain(): Promise<void> {
            this.failure = false;
            this.completed = [];
            this.ignored = [];
        },
        notifyCleared(): Promise<void> {
            this.cleared = true;
            return promiseAfter(3000).then(() => {
                this.cleared = false;
            });
        },
        notifySuccess(): Promise<void> {
            this.success = true;
            this.done = true;
            return promiseAfter(3000).then(() => {
                this.success = false;
            });
        },
        async notifyFailure(): Promise<void> {
            this.failure = true;
        },
        async onNavigatingTo(): Promise<void> {
            console.log("Wait::onNavigatingTo");
            await keepAwake();
        },
        async onNavigatingFrom(): Promise<void> {
            console.log("Wait::onNavigatingFrom");
            await allowSleepAgain();
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
