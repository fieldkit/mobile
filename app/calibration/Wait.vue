<template>
    <StackLayout>
        <Label>Waiting {{ remaining.toFixed(0) }} seconds</Label>

        <Label @tap="done" v-if="doneWaiting">Continue</Label>
        <Label @tap="skip" v-else>Skip</Label>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "../wrappers/vue";
import { _T } from "../utilities";
import { CalibrationWaitStep } from "./model";
import { Timer } from "../common/timer";

export default Vue.extend({
    props: {
        step: {
            type: CalibrationWaitStep,
            required: true,
        },
        visual: {
            type: Object,
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
        remaining(this: any) {
            const elapsed = (this.now.getTime() - this.started.getTime()) / 1000;
            return Math.max(this.step.seconds - elapsed, 0);
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
        skip(this: any) {
            this.$emit("done");
        },
    },
});
</script>

<style scoped lang="scss">
@import "../app-variables";
</style>
