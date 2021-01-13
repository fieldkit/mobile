<template>
    <Page>
        <PlatformHeader :title="_L('modulesTitle')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*,70">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
                <StackLayout class="p-t-10">
                    <CalibratingModules :station="station" @selected="calibrateModule" />
                </StackLayout>
            </ScrollView>
            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { _T } from "../../utilities";
import routes from "../../routes";
import SharedComponents from "@/components/shared";
import CalibratingModules from "../onboarding/CalibratingModules.vue";
import { StationCalibration, ModuleCalibration } from "@/calibration/model";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

export default Vue.extend({
    components: {
        ...SharedComponents,
        CalibratingModules,
        ConnectionStatusHeader,
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
        deployed(): boolean {
            return this.$s.getters.availableStationsById[this.stationId].deployStartTime !== null;
        },
    },
    methods: {
        async calibrateModule(m: ModuleCalibration): Promise<void> {
            console.log("module", m);
            await this.$navigateTo(routes.calibration.start, {
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
