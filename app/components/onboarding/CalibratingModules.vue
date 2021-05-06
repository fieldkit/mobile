<template>
    <StackLayout>
        <GridLayout rows="auto" columns="*" class="m-t-10" v-for="m in station.modules" :key="m.id">
            <StackLayout class="bordered-container p-10" @tap="selected(m)">
                <GridLayout rows="auto,auto" columns="15*,70*,15*">
                    <Image row="0" col="0" rowSpan="2" width="40" horizontalAlignment="left" :src="m.image" class="module-icon" />

                    <Label
                        row="0"
                        col="1"
                        rowSpan="1"
                        :text="m.name"
                        verticalAlignment="middle"
                        class="size-18 module-name"
                        textWrap="true"
                    />

                    <template v-if="m.canCalibrate">
                        <Label
                            row="1"
                            col="1"
                            :text="_L('calibration.uncalibrated')"
                            class="size-14 red-text module-status"
                            v-if="!m.isCalibrated"
                        />
                        <Label
                            row="1"
                            col="1"
                            :text="_L('calibration.calibrated')"
                            class="size-14 gray-text module-status"
                            v-if="m.isCalibrated"
                        />
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
                        <Label row="1" col="1" :text="_L('noCalibrationNeeded')" class="size-14 gray-text module-status" />
                        <Image row="0" col="2" rowSpan="2" width="20" horizontalAlignment="right" src="~/images/Icon_Success.png" />
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
.module-icon {
    // background-color: orange;
}
GridLayout {
    // background-color: #af8383;
}
.ns-ios .module-name,
.ns-ios .module-status {
    padding-left: 10;
}
</style>
