<template>
    <GridLayout rows="*,auto">
        <StackLayout row="0">
            <ProgressBarAndStatus :connected="sensor.connected" :progress="progress" />

            <Label class="instruction-heading" :text="visual.heading" textWrap="true" />

            <StackLayout class="form">
                <Label col="1" class="m-t-5 m-l-5 m-b-20 size-16 text-center" :text="_L(form.label)" textWrap="true" v-if="!doneWaiting" />
                <Label
                    col="1"
                    class="m-t-5 m-l-5 m-b-20 size-16 text-center"
                    :text="_L('calibrationDoneHeading')"
                    textWrap="true"
                    v-if="doneWaiting"
                />

                <GridLayout rows="auto,auto" columns="*" height="200">
                    <StackLayout row="0" class="sensor-circular-border m-t-20" height="200" width="200">
                        <Label
                            :text="_L('calibrationSensorValue')"
                            verticalAlignment="bottom"
                            textAlignment="center"
                            class="m-r-5 m-t-30 size-12 hint-text"
                        />
                        <FlexboxLayout verticalAlignment="middle" justifyContent="center" class="m-t-25">
                            <Label :text="sensor.unitOfMeasure" verticalAlignment="bottom" class="m-r-5 m-t-5 size-14" />
                            <StackLayout verticalAlignment="bottom">
                                <Label :text="sensor.uncalibrated | prettyReading" class="size-26" />
                                <Label :text="sensor.calibrated | prettyReading" v-if="beta" />
                            </StackLayout>
                        </FlexboxLayout>
                    </StackLayout>
                    <GridLayout row="0" height="75" verticalAlignment="bottom" backgroundColor="white">
                        <StackLayout orientation="horizontal" class="input-wrap" verticalAlignment="top">
                            <TextField
                                width="34%"
                                verticalAlignment="center"
                                v-model="form.value"
                                autocorrect="false"
                                autocapitalizationType="none"
                                class="reference-field size-24 m-t-5 m-r-10"
                                keyboardType="number"
                                @textChange="onChange()"
                            />
                            <Label
                                verticalAlignment="center"
                                width="66%"
                                class="size-14"
                                :text="_L('calibrationStandardValue') + ' (' + sensor.unitOfMeasure + ')'"
                                textWrap="true"
                            />
                        </StackLayout>
                    </GridLayout>
                </GridLayout>
            </StackLayout>
            <StackLayout orientation="horizontal" class="m-t-30" width="120">
                <StackLayout width="40" verticalAlignment="middle" class="p-r-5">
                    <Image width="30" src="~/images/Icon_Timer.png"></Image>
                </StackLayout>
                <StackLayout width="80" class="p-l-10 timer" verticalAlignment="middle">
                    <Label class="size-20 m-b-5" :text="elapsedMs | prettyDuration"></Label>
                    <Label class="size-14" :text="elapsedMs | prettyDurationLabel"></Label>
                </StackLayout>
            </StackLayout>
            <StackLayout class="done-hint" v-if="doneWaiting">
                <Label class="size-16" :text="_L('calibrationDoneHint')" textWrap="true"></Label>
            </StackLayout>
        </StackLayout>
        <StackLayout row="1" class="buttons-container">
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

import { Timer } from "@/lib";
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
        console.log(this.range);
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
        elapsedMs(): number {
            return this.remaining * 1000;
        },
        beta(): boolean {
            return Config.beta;
        },
    },
    mounted(this: any) {
        this.timer = new Timer(1000, () => {
            this.now = new Date();
        });
    },
    destroyed(this: any) {
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
@import "~/_app-common";

.instruction-heading {
    color: $fk-primary-black;
    text-align: center;
    margin-right: 20;
    margin-left: 20;
    font-size: 18;
}

.form {
    margin-right: 20;
    margin-left: 20;
}

.reference-field {
    text-align: right;
    border-color: white;
}

.heading {
    text-align: center;
    padding: 0;
}

.sensor-circular-border {
    border-color: $fk-logo-blue;
    border-width: 9;
    border-radius: 100%;
}

.input-wrap {
    border-width: 2;
    border-color: $fk-gray-lightest;
    border-radius: 22;
    height: 60;
    width: 260;
}

.hint-text {
    color: $fk-gray-hint;
    text-align: center;
}

.done-hint {
    color: $fk-primary-black;
    background-color: $fk-gray-lightest;
    margin-top: 40;
    margin-right: 20;
    margin-left: 20;
    padding: 10;
    text-align: center;
}

.timer {
    border-left-width: 1;
    border-left-color: $fk-gray-lighter;
}

// Declared in common
.buttons-container {
}
</style>
