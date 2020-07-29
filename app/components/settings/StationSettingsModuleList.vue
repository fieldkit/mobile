<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
                    <ScreenHeader :title="_L('modulesTitle')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />

                    <CalibratingModules :station="station" @selected="calibrateModule" />
                </StackLayout>
            </ScrollView>
            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "../../wrappers/vue";
import { _T } from "../../utilities";
import routes from "../../routes";

import ScreenHeader from "../ScreenHeader.vue";
import ScreenFooter from "../ScreenFooter.vue";
import CalibratingModules from "../onboarding/CalibratingModules.vue";

import { ModuleCalibration } from "@/calibration/model";

import * as animations from "../animations";

export default Vue.extend({
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
        station(this: any) {
            return this.$store.getters.stationCalibrations[this.stationId];
        },
        deployed(this: any) {
            return this.$store.getters.legacyStations[this.stationId].deployStartTime !== null;
        },
    },
    methods: {
        onPageLoaded(this: any, args) {},
        goBack(this: any, ev) {
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
        calibrateModule(this: any, m: ModuleCalibration) {
            console.log("module", m);
            return this.$navigateTo(routes.calibration.start, {
                clearHistory: true,
                props: {
                    stationId: this.station.id,
                    position: m.position,
                },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
