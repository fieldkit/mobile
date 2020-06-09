<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
                    <ScreenHeader title="Module" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                    <GridLayout rows="auto" columns="15*,85*" class="p-10 m-x-10">
                        <!-- module icon -->
                        <Image col="0" width="40" horizontalAlignment="left" :src="getModuleImage(module)"></Image>
                        <!-- module name -->
                        <Label row="0" col="1" :text="getModuleName(module)" verticalAlignment="middle" class="size-18" textWrap="true" />
                    </GridLayout>

                    <StackLayout class="m-y-30">
                        <Label text="Calibration" class="size-20 m-x-15 m-b-10" />
                        <Label :text="calibrationText" lineHeight="3" class="size-15 m-x-15 m-b-20" textWrap="true" />
                        <Button
                            text="Calibrate Sensor"
                            :isEnabled="station.connected"
                            @tap="goToCalibration"
                            class="btn btn-primary btn-padded"
                            v-show="module.calibrateSensor"
                        ></Button>
                        <ConnectionNote :station="station" />
                    </StackLayout>
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
import Modules from "./StationSettingsModuleList";
import ConnectionNote from "./StationSettingsConnectionNote";

export default {
    data() {
        return {
            calibrationText: "",
        };
    },
    props: ["station", "module"],
    components: {
        ScreenHeader,
        ScreenFooter,
        Modules,
        ConnectionNote,
    },
    methods: {
        onPageLoaded(args) {
            if (this.module.calibrateSensor) {
                this.calibrationText = "Calibrate your sensor any time. It is recommended to calibrate every 6 months to a year.";
            } else {
                this.calibrationText = "No calibration needed for this sensor.";
            }
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

            this.$navigateTo(Modules, {
                props: {
                    station: this.station,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
        },

        goToCalibration(event) {
            // navigate to calibration
            this.$navigateTo(routes.calibration, {
                props: {
                    station: this.station,
                    type: this.module.calibrateSensor,
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
</style>
