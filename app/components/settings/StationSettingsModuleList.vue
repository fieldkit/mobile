<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
                    <ScreenHeader :title="_L('modulesTitle')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />

                    <GridLayout rows="auto" columns="*" v-for="(m, moduleIndex) in modules" :key="m.id" :dataModule="m" @tap="goToModule">
                        <StackLayout :class="'bordered-container ' + (moduleIndex == modules.length - 1 ? 'bottom-border' : '')">
                            <!-- top row of module list -->
                            <GridLayout rows="auto" columns="15*,85*">
                                <!-- module icon -->
                                <Image col="0" width="40" horizontalAlignment="left" :src="getModuleImage(m)"></Image>
                                <!-- module name -->
                                <Label
                                    row="0"
                                    col="1"
                                    :text="getModuleName(m)"
                                    verticalAlignment="middle"
                                    class="size-18"
                                    textWrap="true"
                                />
                            </GridLayout>
                        </StackLayout>
                    </GridLayout>
                </StackLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../../routes";
import { getLastSeen, _T, convertOldFirmwareResponse } from "../../utilities";
import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";
import Module from "./StationSettingsModule";

const sensorsThatCalibrate = ["ph", "do", "ec"];

export default {
    data() {
        return {
            modules: [],
        };
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
        station: {
            required: true,
            type: Object,
        },
    },
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    methods: {
        onPageLoaded(args) {
            this.modules = this.station.moduleObjects.sort((a, b) => {
                return b.position < a.position ? 1 : b.position > a.position ? -1 : 0;
            });

            this.modules.forEach((m, i) => {
                m.sensorObjects.forEach((s) => {
                    if (sensorsThatCalibrate.indexOf(s.name) > -1) {
                        m.calibrateSensor = s.name;
                    }
                });
            });
        },

        goBack(event) {
            if (event) {
                // Change background color when pressed
                let cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            this.$navigateTo(routes.stationSettings, {
                props: {
                    stationId: this.stationId,
                    station: this.station,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
        },

        goToModule(event) {
            if (event) {
                // Change background color when pressed
                let cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            this.$navigateTo(Module, {
                props: {
                    stationId: this.stationId,
                    station: this.station,
                    module: event.object.dataModule,
                },
            });
        },

        getModuleName(module) {
            const newName = convertOldFirmwareResponse(module);
            return _T(newName + ".name");
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
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
// End custom common variables

// Custom styles
.bordered-container {
    padding: 10;
    margin-left: 10;
    margin-right: 10;
    border-color: $fk-gray-lighter;
    border-top-width: 1;
}
.bottom-border {
    border-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.trend-icon {
    margin-bottom: 6;
}

.unit {
    margin-left: 2;
    margin-bottom: 3;
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
