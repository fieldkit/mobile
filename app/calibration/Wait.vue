<template>
    <GridLayout rows="82,*,80">
        <Header row="0" :title="visual.title" :subtitle="visual.subtitle" :icon="visual.icon" @back="back" />
        <StackLayout row="1">
            <ProgressBarAndStatus :connected="sensor.connected" :progress="progress" />
            <Label class="instruction-heading" :text="visual.heading" lineHeight="4" textWrap="true" />
            <CircularTimer
                :progress="waitingProgress"
                :animated="true"
                :elapsed="elapsed"
                :unitOfMeasure="sensor.unitOfMeasure"
                :reading="sensor.reading"
            />
        </StackLayout>
        <StackLayout row="2">
            <Button class="btn btn-primary btn-padded" :text="visual.done" @tap="done" :isEnabled="doneWaiting" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import { CalibrationWaitStep, CalibratingSensor } from "./model";
import { WaitVisual } from "./visuals";

import { _T } from "../utilities";

import Vue from "../wrappers/vue";
import Header from "./Header.vue";
import ProgressBarAndStatus from "./ProgressBarAndStatus.vue";
import CircularTimer from "./CircularTimer.vue";

import { Timer } from "../common/timer";

export default Vue.extend({
    name: "Wait",
    components: {
        Header,
        ProgressBarAndStatus,
        CircularTimer,
    },
    props: {
        sensor: {
            type: CalibratingSensor,
            required: true,
        },
        step: {
            type: CalibrationWaitStep,
            required: true,
        },
        visual: {
            type: WaitVisual,
            required: true,
        },
        progress: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            timer: null,
            started: new Date(),
            now: new Date(),
        };
    },
    computed: {
        waitingProgress(this: any) {
            return (this.elapsed / this.visual.seconds) * 100;
        },
        elapsed(this: any) {
            return (this.now.getTime() - this.started.getTime()) / 1000;
        },
        remaining(this: any) {
            return Math.max(this.visual.seconds - this.elapsed, 0);
        },
        doneWaiting(this: any) {
            return this.remaining === 0;
        },
    },
    mounted(this: any) {
        console.log("cal:waiting:", "mounted", this.step, this.visual);
        this.timer = new Timer(1000, () => {
            this.now = new Date();
        });
    },
    destroyed(this: any) {
        console.log("cal:waiting:", "destroyed");
        this.timer.stop();
    },
    methods: {
        done(this: any) {
            this.$emit("done");
        },
        back(this: any) {
            this.$emit("back");
        },
        skip(this: any) {
            this.$emit("done");
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
