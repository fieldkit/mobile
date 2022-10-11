<template>
    <StackLayout>
        <StackLayout class="field-container">
            <Label :text="_L('calibration.summary.calibrationMethod')" textWrap="true" class="field-label" />
            <Label v-if="calibrationPoints == 3" :text="_L('calibration.summary.threePointMethod')" textWrap="true" class="field-value" />
            <Label v-else :text="_L('calibration.summary.notCalibrated')" textWrap="true" class="field-value" />
        </StackLayout>

        <StackLayout class="field-container">
            <GridLayout rows="auto" columns="auto,auto">
                <Label row="0" col="0" :text="_L('calibration.summary.standardValues')" textWrap="true" class="field-label" />
                <Label row="0" col="1" :text="'(' + units + ')'" textWrap="true" class="field-label units" />
            </GridLayout>
            <Label :text="calibratedStandards" textWrap="true" class="field-value" />
        </StackLayout>

        <StackLayout class="field-container">
            <GridLayout rows="auto" columns="auto,auto">
                <Label row="0" col="0" :text="_L('calibration.summary.factorySensorValues')" textWrap="true" class="field-label" />
                <Label row="0" col="1" :text="'(' + units + ')'" textWrap="true" class="field-label units" />
            </GridLayout>
            <Label :text="sensorValues" textWrap="true" class="field-value" />
        </StackLayout>

        <StackLayout class="field-container">
            <Label :text="_L('calibration.summary.lastCalibrated')" textWrap="true" class="field-label" />
            <Label :text="calibratedDate" textWrap="true" class="field-value" />
        </StackLayout>
    </StackLayout>
</template>

<script lang="ts">
import _ from "lodash";
import moment from "moment";
import Vue from "vue";
import { CalibratingSensor, ModuleConfiguration } from "./model";

export default Vue.extend({
    name: "CalibrationSummary",
    props: {
        sensor: {
            type: CalibratingSensor,
            required: true,
        },
    },
    computed: {
        units(): string | undefined {
            return this.sensor.unitOfMeasure;
        },
        existing(): ModuleConfiguration | null {
            return this.sensor.moduleCalibration;
        },
        calibrationPoints(): number {
            return this.sensor.moduleCalibration?.calibration?.points?.length || 0;
        },
        calibratedStandards(): string | undefined {
            return this.sensor.moduleCalibration?.calibration?.points
                ?.map((p) => {
                    if (!p.references) throw new Error();
                    return p.references[0].toFixed(3); // prettyReading
                })
                .join(", ");
        },
        sensorValues(): string | undefined {
            return this.sensor.moduleCalibration?.calibration?.points
                ?.map((p) => {
                    if (!p.factory) {
                        if (!p.uncalibrated) throw new Error();
                        return p.uncalibrated[0].toFixed(3); // prettyReading
                    }
                    return p.factory[0].toFixed(3); // prettyReading
                })
                .join(", ");
        },
        calibratedDate(): string | null {
            const unix = this.sensor.moduleCalibration?.calibration?.time;
            if (unix) {
                return moment(unix * 1000).format("MM/DD/YYYY h:mm:ss a");
            }
            return null;
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
