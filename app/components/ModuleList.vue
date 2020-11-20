<template>
    <StackLayout class="m-t-5 m-b-10 m-l-10 m-r-10">
        <GridLayout v-for="m in station.modules" :key="m.id" rows="auto" columns="*">
            <template v-if="!m.internal">
                <StackLayout class="bordered-container p-10 m-b-10">
                    <GridLayout rows="auto" columns="15*,70*,15*">
                        <Image col="0" width="40" horizontalAlignment="left" :src="getModuleImage(m, station.connected)"></Image>
                        <Label col="1" :text="getModuleName(m)" verticalAlignment="middle" class="size-16" textWrap="true" />

                        <FlexboxLayout
                            col="2"
                            class="expand-button-container"
                            flexDirection="column"
                            justifyContent="space-around"
                            alignItems="center"
                            @tap="toggleContainer(m)"
                        >
                            <Image
                                class="expand-button"
                                width="25"
                                :src="closed[m.position] !== true ? '~/images/Icon_Cheveron_Down.png' : '~/images/Icon_Cheveron_Up.png'"
                            />
                        </FlexboxLayout>
                    </GridLayout>

                    <WrapLayout v-if="closed[m.position] !== true" orientation="horizontal" class="m-t-5">
                        <Label v-if="!station.connected" :text="lastSeen()" width="100%" class="m-t-5 size-14 hint-color" />
                        <WrapLayout
                            v-for="s in m.sensors"
                            :key="s.id"
                            orientation="horizontal"
                            class="sensor-block"
                            :class="station.connected ? 'station-connected' : 'station-disconnected'"
                        >
                            <FlexboxLayout>
                                <Image width="7" verticalAlignment="bottom" :src="getDisplayIcon(s)" class="trend-icon"></Image>
                                <Label flexShrink="0.25" :text="getDisplayReading(s)" verticalAlignment="bottom" class="size-24 m-l-2" />
                                <Label :text="s.unit" verticalAlignment="bottom" class="unit size-12 m-t-10" />
                            </FlexboxLayout>
                            <Label :text="getSensorName(m, s)" textWrap="true" class="sensor-name size-14" />
                        </WrapLayout>
                    </WrapLayout>
                </StackLayout>
            </template>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import _ from "lodash";
import { getLastSeen, _T, convertOldFirmwareResponse } from "@/utilities";
import { Station, Module, Sensor } from "@/store";

export default Vue.extend({
    name: "ModuleListView",
    props: {
        station: {
            type: Object as () => Station,
            required: true,
        },
    },
    data(): { closed: { [index: number]: boolean } } {
        return {
            closed: {},
        };
    },
    methods: {
        getDisplayReading(s: Sensor): string {
            if (s.reading === null) {
                return "--";
            }
            return s.reading.toFixed(1);
        },
        getDisplayIcon(s: Sensor): string {
            if (s.trend) {
                if (s.trend > 0) {
                    return "~/images/Icon_Increase.png";
                }
                if (s.trend < 0) {
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
        getModuleName(mod: Module): string {
            const newName = convertOldFirmwareResponse(mod);
            return _T(newName + ".name");
        },
        getSensorName(mod: Module, sensor: Sensor): string {
            const newName = convertOldFirmwareResponse(mod);
            return _T(newName + ".sensors." + sensor.name);
        },
        getModuleImage(mod: Module, connected: boolean): string {
            const statusString = connected ? "" : "Gray_";
            switch (mod.name) {
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
                case "modules.water.temp":
                    return `~/images/Icon_${statusString}WaterTemp_Module.png`;
                case "modules.water.orp":
                    return `~/images/Icon_${statusString}Water_Module.png`;
                case "modules.water.unknown":
                    return `~/images/Icon_${statusString}Water_Module.png`;
                default:
                    return `~/images/Icon_${statusString}Generic_Module.png`;
            }
        },
        emitModuleTapped(mod: Module): void {
            this.$emit("module-tapped", mod);
        },
        toggleContainer(mod: Module): void {
            console.log("toggle", this.closed[mod.position]);
            if (this.closed[mod.position] === true) {
                Vue.set(this.closed, mod.position, false);
            } else {
                Vue.set(this.closed, mod.position, true);
            }
            console.log("toggle", this.closed);
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
.expand-button-container {
    /* background-color: #afefef; */
}
.expand-button {
    /* background-color: #efefaf; */
}
</style>
