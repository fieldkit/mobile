<template>
    <StackLayout>
        <GridLayout rows="auto" columns="*" class="m-t-10 m-x-20" v-for="m in station.modules" :key="m.id">
            <StackLayout class="bordered-container p-10" @tap="selected(m)">
                <GridLayout rows="auto, auto" columns="15*,70*,15*">
                    <Image rowSpan="2" col="0" width="40" horizontalAlignment="left" :src="m.image" />
                    <Label row="0" col="1" rowSpan="1" :text="m.name" verticalAlignment="middle" class="size-18" textWrap="true" />

                    <template v-if="m.canCalibrate">
                        <Label row="1" col="1" :text="_L('uncalibrated')" class="size-14 red-text" v-if="!m.isCalibrated" />
                        <Label row="1" col="1" :text="_L('calibrated')" class="size-14 gray-text" v-if="m.isCalibrated" />
                        <Image
                            rowSpan="2"
                            col="2"
                            width="20"
                            horizontalAlignment="right"
                            src="~/images/Icon_Success.png"
                            v-if="m.isCalibrated"
                        />
                    </template>
                    <template v-else>
                        <Label row="1" col="1" :text="_L('noCalibrationNeeded')" class="size-14 gray-text" />
                        <Image rowSpan="2" col="2" width="20" horizontalAlignment="right" src="~/images/Icon_Success.png" />
                    </template>
                </GridLayout>
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { StationCalibration, ModuleCalibration } from "@/calibration/model";

export default Vue.extend({
    name: "CalibratingModules",
    components: {
        ...SharedComponents,
    },
    props: {
        station: {
            type: StationCalibration,
            required: true,
        },
    },
    data() {
        return {};
    },
    methods: {
        selected(m: ModuleCalibration): void {
            this.$emit("selected", m);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.gray-text {
    color: $fk-gray-hint;
}
.red-text {
    color: $fk-primary-red;
}
</style>
