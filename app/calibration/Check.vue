<template>
    <GridLayout rows="82,*,80">
        <Header row="0" :title="visual.title" :subtitle="visual.subtitle" :icon="visual.icon" @back="back" />
        <StackLayout row="1">
            <ProgressBarAndStatus :connected="sensor.connected" :progress="progress" />
            <Label class="instruction-heading" :text="visual.heading" lineHeight="4" textWrap="true" />

            <Label
                class="existing-calibration"
                text="This sensor doesn't appear to have been calibrated."
                textWrap="true"
                v-if="existing.total == 0"
            />
            <Label
                class="existing-calibration"
                text="This sensor appears to have been calibrated using a 1-point strategy."
                textWrap="true"
                v-if="existing.total == 1"
            />
            <Label
                class="existing-calibration"
                text="This sensor appears to have been calibrated using a 2-point strategy."
                textWrap="true"
                v-if="existing.total == 2"
            />
            <Label
                class="existing-calibration"
                text="This sensor appears to have been calibrated using a 3-point strategy."
                textWrap="true"
                v-if="existing.total == 3"
            />
            <Label
                class="existing-calibration"
                text="This sensor appears to have been calibrated using a 4-point strategy."
                textWrap="true"
                v-if="existing.total == 4"
            />

            <Label class="existing-calibration" text="You may also clear any calibration data for this sensor." textWrap="true" />

            <Button class="btn btn-padded" text="Clear" @tap="clear" />
        </StackLayout>
        <StackLayout row="2">
            <Button class="btn btn-primary btn-padded" :text="visual.done" @tap="done" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import { VisualCalibrationStep, CalibratingSensor } from "./model";
import { CheckVisual } from "./visuals";

import { _T } from "../utilities";

import Vue from "../wrappers/vue";
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
        visual: {
            type: CheckVisual,
            required: true,
        },
        progress: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {};
    },
    computed: {
        existing(this: any) {
            return this.sensor.calibration;
        },
    },
    methods: {
        back(this: any) {
            this.$emit("back");
        },
        done(this: any) {
            this.$emit("done");
        },
        clear(this: any) {
            this.$emit("clear");
        },
    },
});
</script>

<style scoped lang="scss">
@import "../app-variables";

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
    margin-right: 20;
    margin-left: 20;
    font-size: 16;
}
</style>
