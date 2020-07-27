<template>
    <GridLayout rows="82,*,80">
        <Header row="0" :title="visual.title" :subtitle="visual.subtitle" :icon="visual.icon" @back="back" />
        <StackLayout row="1">
            <ProgressBarAndStatus :connected="sensor.connected" :progress="progress" />
            <Label class="instruction-heading" :text="visual.heading" lineHeight="4" textWrap="true" />
            <Label class="instruction-text" :text="visual.instructions" lineHeight="4" textWrap="true" />
            <Image verticalAlignment="middle" class="illo" :src="visual.image" />
        </StackLayout>
        <StackLayout row="2">
            <Button class="btn btn-primary btn-padded" :text="visual.done" @tap="done" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import { CalibrationPrepareStep, CalibratingSensor } from "./model";
import { PrepareVisual } from "./visuals";

import { _T } from "../utilities";

import Vue from "../wrappers/vue";
import Header from "./Header.vue";
import ProgressBarAndStatus from "./ProgressBarAndStatus.vue";

export default Vue.extend({
    name: "Prepare",
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
            type: CalibrationPrepareStep,
            required: true,
        },
        visual: {
            type: PrepareVisual,
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
    },
});
</script>

<style scoped lang="scss">
@import "../app-variables";

.instruction-heading,
.instruction-text {
    color: $fk-primary-black;
    text-align: center;
    margin-right: 20;
    margin-left: 20;
}
.instruction-heading {
    font-size: 18;
}
.instruction-text {
    font-size: 16;
}
.illo {
    margin: 20;
}
</style>
