<template>
    <StackLayout>
        <GridLayout rows="*,80">
            <StackLayout row="0">
                <ProgressBarAndStatus :connected="sensor.connected" :progress="progress" />
                <Label class="instruction-heading" :text="visual.heading" lineHeight="4" textWrap="true" />
                <Label class="instruction-text" :text="visual.instructions" lineHeight="4" textWrap="true" />
                <Image verticalAlignment="middle" class="illo" :src="visual.image" />
            </StackLayout>
            <StackLayout row="1">
                <Button class="btn btn-primary btn-padded" :text="visual.done" @tap="done" />
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import { VisualCalibrationStep, CalibratingSensor } from "./model";
import { PrepareVisual } from "./visuals";

import { _T } from "../utilities";

import Vue from "vue";
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
            type: VisualCalibrationStep,
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
        visual(this: any): PrepareVisual {
            return this.step.visual;
        },
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
@import "~/_app-variables";

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
