<template>
    <GridLayout rows="*,auto">
        <StackLayout row="0">
            <ProgressBarAndStatus :connected="sensor.connected" :progress="progress" />
            <Label class="instruction-heading" :text="visual.heading" lineHeight="4" textWrap="true" />

            <Label class="existing-calibration" :text="visual.uncalibrated" textWrap="true" v-if="calibrationPoints == 0" />
            <Label class="existing-calibration" :text="visual.calibrated" textWrap="true" v-if="calibrationPoints > 0" />

            <Label class="existing-calibration" :text="visual.instructions" textWrap="true" />

            <Label class="debugging-title" text="Debugging:" textWrap="true" v-if="debugging" />
            <Label class="calibration-debugging" :text="debugging" textWrap="true" v-if="debugging" />

            <Button class="btn btn-padded" :text="visual.clear" :isEnabled="!busy" @tap="clear" />
        </StackLayout>
        <StackLayout row="1">
            <Button class="btn btn-primary btn-padded" :isEnabled="!busy" :text="visual.done" @tap="done" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import { VisualCalibrationStep, CalibratingSensor, ModuleConfiguration } from "./model";
import { CheckVisual } from "./visuals";

import Config from "@/config";

import Vue from "vue";
import Header from "./Header.vue";
import ProgressBarAndStatus from "./ProgressBarAndStatus.vue";

export default Vue.extend({
    name: "Check",
    components: {
        Header,
        ProgressBarAndStatus,
    },
    props: {
        sensor: {
            type: CalibratingSensor,
            required: true,
        },
        step: {
            type: VisualCalibrationStep,
            required: true,
        },
        progress: {
            type: Number,
            required: true,
        },
        busy: {
            type: Boolean,
            required: true,
        },
    },
    data(): {} {
        return {};
    },
    computed: {
        visual(): CheckVisual {
            return this.step.visual as CheckVisual;
        },
        existing(): ModuleConfiguration | null {
            return this.sensor.moduleCalibration;
        },
        calibrationPoints(): number {
            return this.sensor.moduleCalibration?.calibration?.points?.length || 0;
        },
        debugging(): string | null {
            if (Config.beta) {
                return JSON.stringify(this.sensor.moduleCalibration);
            }
            return null;
        },
    },
    methods: {
        back(): void {
            this.$emit("back");
        },
        done(): void {
            this.$emit("done");
        },
        clear(): void {
            this.$emit("clear");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.instruction-heading {
    color: $fk-primary-black;
    text-align: center;
    margin-right: 20;
    margin-left: 20;
}

.instruction-heading {
    font-size: 18;
}

.existing-calibration {
    color: $fk-primary-black;
    text-align: center;
    margin-top: 20;
    margin-right: 20;
    margin-left: 20;
    font-size: 16;
}

.debugging-title {
    font-size: 14;
    font-weight: bold;
    margin-top: 20;
    margin-right: 20;
    margin-left: 20;
}

.calibration-debugging {
    padding: 20;
}
</style>
