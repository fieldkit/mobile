<template>
    <StackLayout class="m-t-5 m-b-10 m-l-10 m-r-10" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout rows="auto" columns="*" v-for="(m, moduleIndex) in station.modules" :key="m.id">
            <StackLayout class="bordered-container p-10 m-b-10">
                <!-- top row of module list -->
                <GridLayout rows="auto" columns="15*,70*,15*">
                    <!-- module icon -->
                    <Image col="0" width="40" horizontalAlignment="left" :src="getModuleImage(m)"></Image>
                    <!-- module name -->
                    <Label col="1" :text="getModuleName(m)" verticalAlignment="middle" class="size-18" textWrap="true" />
                    <!-- toggle sensor container -->
                    <Image
                        col="2"
                        verticalAlignment="center"
                        horizontalAlignment="right"
                        :src="closed.indexOf(m.id) > -1 ? '~/images/Icon_Cheveron_Down.png' : '~/images/Icon_Cheveron_Up.png'"
                        width="25"
                        :dataId="'m_id-' + m.id"
                        @tap="toggleContainer"
                    ></Image>
                </GridLayout>
                <!-- sensor container -->
                <WrapLayout orientation="horizontal" class="m-t-5" v-if="closed.indexOf(m.id) < 0">
                    <Label :text="lastSeen()" width="100%" v-if="!station.connected" class="m-t-5 size-14 hint-color" />
                    <WrapLayout
                        orientation="horizontal"
                        v-for="(s, sensorIndex) in m.sensors"
                        :key="s.id"
                        class="sensor-block"
                        :opacity="station.connected ? 1 : 0.5"
                    >
                        <!-- keep arrows, reading, and unit on same line -->
                        <FlexboxLayout>
                            <!-- trend arrow -->
                            <Image width="7" verticalAlignment="bottom" :src="getDisplayIcon(s)" class="trend-icon"></Image>
                            <!-- reading -->
                            <Label flexShrink="0.25" :text="getDisplayReading(s)" verticalAlignment="bottom" class="size-24 m-l-2" />
                            <!-- unit -->
                            <Label :text="s.unit" verticalAlignment="bottom" class="unit size-12 m-t-10" />
                        </FlexboxLayout>
                        <!-- name -->
                        <Label :text="getSensorName(m, s)" textWrap="true" class="sensor-name size-14" />
                    </WrapLayout>
                    <!-- view graph link -->
                    <!-- <StackLayout class="link-container text-center">
                        <Label
                            :text="_L('viewGraph')"
                            :id="'m_id-' + m.id"
                            class="view-graph-link text-center"
                            :automationText="'moduleLink' + moduleIndex"
                            @tap="emitModuleTapped"
                        />
                    </StackLayout> -->
                </WrapLayout>
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script>
import _ from "lodash";
import routes from "../routes";
import { getLastSeen, _T, convertOldFirmwareResponse } from "../utilities";
import Services from "../services/services";
const dbInterface = Services.Database();

export default {
    name: "ModuleListView",
    data: () => {
        return {
            closed: [],
        };
    },
    props: { station: { required: true } },
    methods: {
        getDisplayReading(s) {
            if (s.reading === null) {
                return "--";
            }
            return s.reading.toFixed(1);
        },
        getDisplayIcon(s) {
            if (s.trend > 0) {
                return "~/images/Icon_Increase.png";
            }
            if (s.trend < 0) {
                return "~/images/Icon_Decrease.png";
            }
            return "~/images/Icon_Neutral.png";
        },
        onPageLoaded(args) {},

        onUnloaded() {},

        lastSeen() {
            if (!this.station || !this.station.updated) {
                return "";
            }
            return _L("lastReading") + " " + getLastSeen(this.station.updated);
        },

        getModuleName(module) {
            const newName = convertOldFirmwareResponse(module);
            return _T(newName + ".name");
        },

        getSensorName(module, sensor) {
            const newName = convertOldFirmwareResponse(module);
            return _T(newName + ".sensors." + sensor.name);
        },

        getModuleImage(module) {
            switch (module.name) {
                case "modules.distance":
                    return "~/images/Icon_Distance_Module.png";
                    break;
                case "modules.weather":
                    return "~/images/Icon_Weather_Module.png ";
                    break;
                case "modules.water.ec":
                    return "~/images/Icon_WaterConductivity_Module.png";
                    break;
                case "modules.water.ph":
                    return "~/images/Icon_WaterpH_Module.png";
                    break;
                case "modules.water.do":
                    return "~/images/Icon_DissolvedOxygen_Module.png";
                    break;
                case "modules.water.temp":
                    return "~/images/Icon_WaterTemp_Module.png";
                    break;
                case "modules.water.orp":
                    return "~/images/Icon_Water_Module.png";
                    break;
                case "modules.water.unknown":
                    return "~/images/Icon_Water_Module.png";
                    break;
                default:
                    return "~/images/Icon_Generic_Module.png";
                    break;
            }
        },

        emitModuleTapped(event) {
            this.$emit("moduleTapped", event);
        },

        toggleContainer(event) {
            let id = event.object.dataId.split("m_id-")[1];
            id = parseInt(id);
            let index = this.closed.indexOf(id);
            if (index == -1) {
                this.closed.push(id);
            } else {
                this.closed.splice(index, 1);
            }
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
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
</style>
