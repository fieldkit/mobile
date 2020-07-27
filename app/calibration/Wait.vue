<template>
    <GridLayout rows="82,*,80">
        <Header row="0" :title="visual.title" :subtitle="visual.subtitle" :icon="visual.icon" @back="back" />
        <CircularTimer row="1" :progress="50" :animated="true" :elapsed="100" unitOfMeasure="m" />
        <StackLayout row="2">
            <Button class="btn btn-primary btn-padded" :text="visual.done" @tap="done"></Button>
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import Vue from "../wrappers/vue";
import { _T } from "../utilities";
import { CalibrationWaitStep } from "./model";
import { Timer } from "../common/timer";

import Header from "./Header.vue";
import CircularTimer from "./CircularTimer.vue";

export default Vue.extend({
    name: "Wait",
    components: {
        Header,
        CircularTimer,
    },
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
</style>
