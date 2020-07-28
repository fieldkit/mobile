<template>
    <GridLayout rows="82,*,80">
        <Header row="0" :title="visual.title" :subtitle="visual.subtitle" :icon="visual.icon" @back="back" />
        <StackLayout row="1">
            <ProgressBarAndStatus :connected="sensor.connected" :progress="progress" />
            <Label class="instruction-heading" :text="visual.heading" lineHeight="4" textWrap="true" />
        </StackLayout>
        <StackLayout row="2">
            <Button class="btn btn-primary btn-padded" :text="visual.done" @tap="done" />
            <Button class="btn btn-primary btn-padded" :text="visual.skip" @tap="skip" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import { CalibrationCheckStep, CalibratingSensor } from "./model";
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
            type: CalibrationCheckStep,
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
    methods: {
        back(this: any) {
            this.$emit("back");
        },
        done(this: any) {
            this.$emit("done");
        },
        skip(this: any) {
            this.$emit("skip");
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
</style>
