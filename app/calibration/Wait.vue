<template>
    <GridLayout rows="*,auto">
        <StackLayout row="0">
            <ProgressBarAndStatus :connected="sensor.connected" :progress="progress" />

            <Label class="instruction-heading" :text="visual.heading" lineHeight="4" textWrap="true" />

            <StackLayout class="form">
                <Label col="1" class="m-t-5 m-l-5 heading" :text="_L(form.label)" textWrap="true" />

                <TextField v-model="form.value" autocorrect="false" autocapitalizationType="none" class="input" @textChange="onChange()" />

                <Label
                    v-show="!form.valid"
                    class="validation-error"
                    horizontalAlignment="left"
                    text="A number is required."
                    textWrap="true"
                />
            </StackLayout>

            <CircularTimer
                :progress="waitingProgress"
                :animated="true"
                :elapsed="remaining"
                :unitOfMeasure="sensor.unitOfMeasure"
                :calibrated="sensor.calibrated"
                :uncalibrated="sensor.uncalibrated"
            />
        </StackLayout>
        <StackLayout row="1">
            <Button
                class="btn btn-primary btn-padded"
                :text="visual.done"
                @tap="calibrate"
                :isEnabled="form.valid && !busy && (doneWaiting || debugging)"
            />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import { VisualCalibrationStep, CalibratingSensor, CalibrationValue } from "./model";
import { WaitVisual } from "./visuals";

import { _T, Timer } from "@/lib";
import Config from "@/config";

import Vue from "vue";
import Header from "./Header.vue";
import ProgressBarAndStatus from "./ProgressBarAndStatus.vue";
import CircularTimer from "./CircularTimer.vue";

import { WaterCalValue } from "./water";
import { required, decimal } from "vuelidate/lib/validators";

class ReferenceForm {
    public value: string;
    public label: string;
    public valid: boolean;
    public range: [number, number];

    constructor(public readonly calibrationValue: CalibrationValue) {
        const calValue = <WaterCalValue>calibrationValue;
        this.value = `${calValue.reference}`;
        this.label = calValue.label;
        this.range = calValue.range;
        this.valid = true;
    }

    public touch(): boolean {
        // eslint-disable-next-line
        const isNumeric: boolean = required(this.value) && decimal(this.value);
        if (isNumeric) {
            const numeric = Number(this.value);
            this.valid = numeric >= this.range[0] && numeric <= this.range[1];
        } else {
            this.valid = false;
        }
        return this.valid;
    }

    public toCalValue(): CalibrationValue {
        if (!this.valid) throw new Error("toCalValue: invalid value");
        const calValue = <WaterCalValue>this.calibrationValue;
        return new WaterCalValue(calValue.index, Number(this.value), this.range, calValue.command);
    }
}

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
    data(): {
        form: ReferenceForm | null;
        timer: Timer | null;
        started: Date;
        now: Date;
    } {
        return {
            form: new ReferenceForm(this.sensor.calibrationValue),
            timer: null,
            started: new Date(),
            now: new Date(),
        };
    },
    computed: {
        visual(this: any): WaitVisual {
            return this.step.visual;
        },
        waitingProgress(this: any): number {
            return (this.elapsed / this.visual.seconds) * 100;
        },
        elapsed(this: any): number {
            return (this.now.getTime() - this.started.getTime()) / 1000;
        },
        remaining(this: any): number {
            return Math.max(this.visual.seconds - this.elapsed, 0);
        },
        doneWaiting(this: any): boolean {
            return this.remaining === 0;
        },
        debugging(): boolean {
            return Config.env.developer;
        },
    },
    mounted(this: any) {
        // console.log("cal:waiting:", "mounted", this.step, this.visual);
        this.timer = new Timer(1000, () => {
            this.now = new Date();
        });
    },
    destroyed(this: any) {
        // console.log("cal:waiting:", "destroyed");
        this.timer.stop();
    },
    methods: {
        calibrate(this: any) {
            this.$emit("calibrate", this.form.toCalValue());
        },
        back(this: any) {
            this.$emit("back");
        },
        skip(this: any) {
            this.$emit("done");
        },
        onChange(): void {
            if (this.form && this.form.touch()) {
                console.log(`on-change: ${JSON.stringify(this.form)}`);
            }
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

.form {
    margin-right: 20;
    margin-left: 20;
}

.validation-error {
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
    padding-bottom: 5;
}
</style>
