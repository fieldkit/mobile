<template>
    <StackLayout class="bordered-container p-10 m-b-10">
        <GridLayout rows="auto" columns="15*,70*,15*">
            <Image col="0" width="40" horizontalAlignment="left" :src="getModuleImage()" class="module-icon" />
            <Label col="1" :text="getModuleName()" verticalAlignment="middle" class="size-16 module-name" textWrap="true" />
            <FlexboxLayout
                col="2"
                class="expand-button-container"
                flexDirection="column"
                justifyContent="space-around"
                alignItems="center"
                @tap="toggleContainer()"
            >
                <Image
                    class="expand-button"
                    width="25"
                    :src="closed[module.position] !== true ? '~/images/Icon_Cheveron_Down.png' : '~/images/Icon_Cheveron_Up.png'"
                />
            </FlexboxLayout>
        </GridLayout>

        <FlexboxLayout
            v-if="moduleCalibration.canCalibrate && moduleCalibration.needsCalibration && station.connected"
            verticalAlignment="middle"
            justifyContent="center"
            class="btn-secondary p-10 m-t-10 m-b-10"
            @tap="calibrateModule"
        >
            <Image col="0" width="16" src="~/images/Icon_Warning_error.png"></Image>
            <Label
                col="1"
                :text="_L('calibrateSensor')"
                class="m-l-10"
                verticalAlignment="middle"
                textWrap="true"
                @loaded="onLabelLoadedCentered"
            />
        </FlexboxLayout>

        <WrapLayout v-if="closed[module.position] !== true" orientation="horizontal" class="m-t-5">
            <Label v-if="!station.connected" :text="lastSeen()" width="100%" class="m-t-5 size-14 hint-color" />
            <WrapLayout
                v-for="sensor in module.sensors"
                :key="sensor.id"
                orientation="horizontal"
                class="sensor-block"
                :class="station.connected ? 'station-connected' : 'station-disconnected'"
            >
                <FlexboxLayout>
                    <Image width="7" verticalAlignment="bottom" :src="getDisplayIcon(sensor)" class="trend-icon"></Image>
                    <Label
                        flexShrink="0.25"
                        :text="getDisplayReading(sensor)"
                        verticalAlignment="bottom"
                        class="size-24 m-l-2"
                        :class="moduleCalibration.canCalibrate && moduleCalibration.needsCalibration ? 'needs-calibration' : ''"
                    />
                    <Label :text="sensor.unitOfMeasure" verticalAlignment="bottom" class="unit size-12 m-t-10" />
                </FlexboxLayout>
                <Label :text="getSensorName(sensor)" textWrap="true" class="sensor-name size-14" />
            </WrapLayout>
        </WrapLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import _ from "lodash";
import { getLastSeen, _T } from "@/lib";
import { Module, Sensor, LegacyStation } from "@/store";
import { isAndroid, Label } from "@nativescript/core";
import { ModuleCalibration, StationCalibration } from "~/calibration";
import { fullRoutes } from "~/routes";

export default Vue.extend({
    name: "ModuleItemView",
    props: {
        station: {
            type: Object as () => LegacyStation,
            required: true,
        },
        module: {
            type: Object as () => Module,
            required: true,
        },
    },
    data(): { closed: { [index: number]: boolean } } {
        return {
            closed: {},
        };
    },
    computed: {
        stationCalibration(): StationCalibration {
            return this.$s.getters.stationCalibrations[this.station.id];
        },
        moduleCalibration(): ModuleCalibration | undefined {
            return this.stationCalibration.modules.find((item) => item.moduleKey === this.module.name);
        },
    },
    methods: {
        getDisplayReading(sensor: Sensor): string {
            if (!_.isNumber(sensor.reading)) {
                return "--";
            }
            return sensor.reading.toFixed(1);
        },
        getDisplayIcon(sensor: Sensor): string {
            if (sensor.trend) {
                if (sensor.trend > 0) {
                    return "~/images/Icon_Increase.png";
                }
                if (sensor.trend < 0) {
                    return "~/images/Icon_Decrease.png";
                }
            }
            return "~/images/Icon_Neutral.png";
        },
        lastSeen(): string {
            if (!this.station || !this.station.lastSeen) {
                return "";
            }
            return _L("lastReading") + " " + getLastSeen(this.station.lastSeen);
        },
        getModuleName(): string {
            return _T(this.module.name + ".name");
        },
        getSensorName(sensor: Sensor): string {
            return _T(this.module.name + ".sensors." + sensor.name);
        },
        getModuleImage(): string {
            const statusString = this.station.connected ? "" : "Gray_";
            switch (this.module.name) {
                case "modules.distance":
                    return `~/images/Icon_${statusString}Distance_Module.png`;
                case "modules.weather":
                    return `~/images/Icon_${statusString}Weather_Module.png`;
                case "modules.water.ec":
                    return `~/images/Icon_${statusString}WaterConductivity_Module.png`;
                case "modules.water.ph":
                    return `~/images/Icon_${statusString}WaterpH_Module.png`;
                case "modules.water.do":
                    return `~/images/Icon_${statusString}DissolvedOxygen_Module.png`;
                case "modules.water.dox":
                    return `~/images/Icon_${statusString}DissolvedOxygen_Module.png`;
                case "modules.water.temp":
                    return `~/images/Icon_${statusString}WaterTemp_Module.png`;
                case "modules.water.orp":
                    return `~/images/Icon_${statusString}ORP_Module.png`;
                case "modules.water.unknown":
                    return `~/images/Icon_${statusString}Water_Module.png`;
                default:
                    return `~/images/Icon_${statusString}Generic_Module.png`;
            }
        },
        toggleContainer(): void {
            console.log("toggle", this.closed[this.module.position]);
            if (this.closed[this.module.position] === true) {
                Vue.set(this.closed, this.module.position, false);
            } else {
                Vue.set(this.closed, this.module.position, true);
            }
            console.log("toggle", this.closed);
        },
        onLabelLoadedCentered(args) {
            const lbl = args.object as Label;
            if (isAndroid) {
                lbl.android.setGravity(17);
            }
        },
        async calibrateModule(): Promise<void> {
            if (!this.station.connected || !this.moduleCalibration) {
                return Promise.resolve();
            }
            await this.$navigateTo(fullRoutes.onboarding.recalibrate(this.station.id));
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}

.sensor-block {
    width: 46%;
    padding: 10;
    margin: 5 2%;
    background: $fk-gray-lightest;
}

.trend-icon {
    margin-bottom: 6;
}

.unit {
    margin-left: 2;
    margin-bottom: 3;
}

.sensor-name {
    width: 100%;
    margin-top: 5;
    font-family: "Avenir LT Pro", "AvenirLTPro-Book";
}

.link-container {
    width: 100%;
}

.view-graph-link {
    width: 125;
    padding: 5;
    margin: 5;
    text-decoration: underline;
}

.hint-color {
    color: $fk-gray-hint;
}

.station-disconnected Label {
    opacity: 0.5;
}

.ns-ios .module-name {
    padding-left: 10;
}

.btn-secondary {
    font-size: 14;
    text-transform: none;
    font-weight: bold;
    border-color: $fk-tertiary-red;
    border-width: 1;
    background-color: white;
    margin-right: 0;
    margin-left: 0;
    color: $fk-tertiary-red;
}

.needs-calibration {
    color: $fk-tertiary-red;
}
</style>
