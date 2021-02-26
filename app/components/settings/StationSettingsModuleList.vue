<template>
    <Page>
        <PlatformHeader :title="_L('modulesTitle')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
                <StackLayout class="p-t-10">
                    <CalibratingModules :station="station" @selected="calibrateModule" />
                </StackLayout>
            </ScrollView>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes, { FullRoute } from "@/routes";
import SharedComponents from "@/components/shared";
import CalibratingModules from "../onboarding/CalibratingModules.vue";
import { StationCalibration, ModuleCalibration } from "@/calibration/model";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

import { Common } from "@/calibration/water";
import { calibrationStrategies } from "@/calibration/strategies";

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
    },
    methods: {
        async calibrateModule(m: ModuleCalibration): Promise<void> {
            const modulesCommon = Common();
            const moduleCommon = modulesCommon[m.moduleKey];
            if (!moduleCommon) throw new Error(`missing module common: ${m.moduleKey}`);
            const flowName = m.moduleKey.replace("modules.", "onboarding.");
            const strategies = calibrationStrategies().getModuleStrategies(m.moduleKey);
            if (!strategies.length) throw new Error(`no strategies for module: ${m.moduleKey}`);
            const strategy = strategies[0];
            await this.$navigateTo(routes.reader.flow, {
                frame: "stations-frame",
                props: {
                    flowName: flowName,
                    icon: moduleCommon.icon,
                    finished: new FullRoute("station/calibrate", "stations-frame", {
                        stationId: this.station.id,
                        position: m.position,
                        strategy: strategy,
                        fromSettings: true,
                    }),
                    skipped: new FullRoute("station/calibrate", "stations-frame", {
                        stationId: this.station.id,
                        position: m.position,
                        strategy: strategy,
                        fromSettings: true,
                    }),
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
