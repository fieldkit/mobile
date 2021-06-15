<template>
    <Page>
        <PlatformHeader :title="_L('modulesTitle')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected">
            <StackLayout row="1" class="text-center connection-warning" v-if="!station.connected">
                <Label :text="_L('stationSettings.modules.disconnected')" class="size-15" textWrap="true" />
            </StackLayout>
            <StackLayout v-if="station.modules.length">
                <CalibratingModules :station="station" @selected="calibrateModule" />
            </StackLayout>
            <NoModulesWannaAdd :connected="station.connected" :stationId="stationId" v-else />
        </StationSettingsLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import NoModulesWannaAdd from "@/components/NoModulesWannaAdd.vue";
import { StationCalibration, ModuleCalibration } from "@/calibration";
import { makeCalibrationRoute } from "@/calibration/start-calibrate";
import CalibratingModules from "../onboarding/CalibratingModules.vue";
import { logNavigationStack } from "@/routes";

export default Vue.extend({
    components: {
        ...SharedComponents,
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
    mounted() {
        logNavigationStack();
    },
    methods: {
        async calibrateModule(moduleCal: ModuleCalibration): Promise<void> {
            if (this.station.connected) {
                const route = await makeCalibrationRoute(this.station, moduleCal);
                await this.$deprecatedNavigateTo(route);
            }
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

.connection-warning {
    padding-top: 8;
    padding-bottom: 5;
    color: $fk-primary-black;
    font-size: 16;
    background-color: #fddb7a;
    height: 37;
}
</style>
