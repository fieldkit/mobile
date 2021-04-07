<template>
    <GridLayout rows="*,auto">
        <ScrollView>
            <StackLayout row="0" v-if="calibrationPoints > 0">
                <ProgressBarAndStatus :connected="sensor.connected" :progress="progress" />

                <StackLayout class="field-container">
                    <Label text="Calibration Method" textWrap="true" class="field-label" />
                    <Label text="Three-point Method" textWrap="true" class="field-value" v-if="calibrationPoints == 3" />
                    <Label text="Not Calibrated" textWrap="true" class="field-value" v-else />
                </StackLayout>

                <StackLayout class="field-container">
                    <GridLayout rows="auto" columns="auto,auto">
                        <Label row="0" col="0" text="Standard Values" textWrap="true" class="field-label" />
                        <Label row="0" col="1" :text="'(' + units + ')'" textWrap="true" class="field-label units" />
                    </GridLayout>
                    <Label :text="calibratedStandards" textWrap="true" class="field-value" />
                </StackLayout>

                <StackLayout class="field-container">
                    <Label text="Last Calibrated" textWrap="true" class="field-label" />
                    <Label :text="calibratedDate" textWrap="true" class="field-value" />
                </StackLayout>

                <StackLayout class="field-container">
                    <Label
                        text="Please check the Product Guide for the suggested re-calibration intervals for each sensor."
                        textWrap="true"
                    />
                </StackLayout>

                <Button class="btn btn-padded btn-clear" :text="visual.clear" :isEnabled="!busy" @tap="clear" />
            </StackLayout>
        </ScrollView>
        <StackLayout row="1">
            <Button class="btn btn-primary btn-padded" :isEnabled="!busy" :text="visual.done" @tap="done" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import moment from "moment";
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
        units(): string | undefined {
            return this.sensor.unitOfMeasure;
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
        calibratedStandards(): string | undefined {
            return this.sensor.moduleCalibration?.calibration?.points
                ?.map((p) => {
                    if (!p.references) throw new Error();
                    return p.references[0].toFixed(2); // prettyReading
                })
                .join(", ");
        },
        calibratedDate(): string | null {
            const unix = this.sensor.moduleCalibration?.calibration?.time;
            if (unix) {
                return moment(unix).format("MM/DD/YYYY h:mm:ss a");
            }
            return null;
        },
    },
    created() {
        if (this.calibrationPoints == 0) {
            console.log(`cal:skip check`);
            this.$emit("done", true);
        }
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

.field-container {
    padding: 10;
}

.field-label {
    font-weight: bold;
    font-size: 16;
}

.field-value {
    margin-bottom: 20;
    font-size: 16;
}

.units {
    margin-left: 5;
}

.btn-clear {
    padding: 10;
}
</style>
