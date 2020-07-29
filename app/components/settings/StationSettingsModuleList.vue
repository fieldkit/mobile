<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
                    <ScreenHeader :title="_L('modulesTitle')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />

                    <CalibratingModules :station="station" />
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
import StationSettingsModule from "./StationSettingsModule";
import CalibratingModules from "../onboarding/CalibratingModules.vue";

import * as animations from "../animations";

export default {
    components: {
        ScreenHeader,
        ScreenFooter,
        CalibratingModules,
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    data() {
        return {};
    },
    computed: {
        station() {
            return this.$store.getters.stationCalibrations[this.stationId];
        },
        deployed() {
            return this.$store.getters.legacyStations[this.stationId].deployStartTime !== null;
        },
    },
    methods: {
        onPageLoaded(args) {},
        goBack(ev) {
            return Promise.all([
                animations.pressed(ev),
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
                }),
            ]);
        },
        goToModule(ev, module) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(StationSettingsModule, {
                    props: {
                        stationId: this.stationId,
                        position: module.position,
                    },
                }),
            ]);
        },
        getModuleName(module) {
            return _T(convertOldFirmwareResponse(module) + ".name");
        },
        getModuleImage(module) {
            switch (module.name) {
                case "modules.distance":
                    return "~/images/Icon_Distance_Module.png";
                case "modules.weather":
                    return "~/images/Icon_Weather_Module.png ";
                case "modules.water.ec":
                    return "~/images/Icon_WaterConductivity_Module.png";
                case "modules.water.ph":
                    return "~/images/Icon_WaterpH_Module.png";
                case "modules.water.do":
                    return "~/images/Icon_DissolvedOxygen_Module.png";
                case "modules.water.temp":
                    return "~/images/Icon_WaterTemp_Module.png";
                case "modules.water.orp":
                    return "~/images/Icon_Water_Module.png";
                case "modules.water.unknown":
                    return "~/images/Icon_Water_Module.png";
                default:
                    return "~/images/Icon_Generic_Module.png";
            }
        },
    },
};
</script>

<style scoped lang="scss">
@import "../../app-variables";

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
