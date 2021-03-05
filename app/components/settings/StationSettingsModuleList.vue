<template>
    <Page>
        <PlatformHeader :title="_L('modulesTitle')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1" v-if="station.modules.length > 0">
                <StackLayout class="p-t-10">
                    <CalibratingModules :station="station" @selected="calibrateModule" />
                </StackLayout>
            </ScrollView>
            <NoModulesWannaAdd row="1" :connected="station.connected" :stationId="stationId" v-else />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import CalibratingModules from "../onboarding/CalibratingModules.vue";
import NoModulesWannaAdd from "@/components/NoModulesWannaAdd.vue";
import { StationCalibration, ModuleCalibration } from "@/calibration";
import { makeCalibrationRoute } from "@/calibration/start-calibrate";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
        CalibratingModules,
        NoModulesWannaAdd,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        station(): StationCalibration {
            return this.$s.getters.stationCalibrations[this.stationId];
        },
    },
    methods: {
        async calibrateModule(moduleCal: ModuleCalibration): Promise<void> {
            const route = await makeCalibrationRoute(this.station, moduleCal);
            await this.$navigateTo(route);
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
