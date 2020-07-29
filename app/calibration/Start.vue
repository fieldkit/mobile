<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <ChooseStrategy :moduleKey="module.name" :strategies="strategies" @choose="choose" @back="back" />
        </StackLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "../wrappers/vue";
import { _T } from "../utilities";

import Calibrate from "./Calibrate.vue";
import ChooseStrategy from "./ChooseStrategy.vue";
import calibrationStrategies from "./strategies";

import Recalibrate from "../components/onboarding/Recalibrate.vue";
import StationSettingsModuleList from "../components/settings/StationSettingsModuleList.vue";

import { CalibrationStrategy } from "./model";

export default Vue.extend({
    name: "Start",
    components: {
        ChooseStrategy,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        position: {
            type: Number,
            required: true,
        },
        fromSettings: {
            default: true,
        },
    },
    data(): {} {
        return {};
    },
    computed: {
        module(this: any) {
            const station = this.$store.getters.stationsById[this.stationId];
            const module = station.modules[this.position];
            if (!module) {
                throw new Error("unable to find module");
            }
            console.log("station-module", module.name);
            return module;
        },
        strategies(this: any) {
            return calibrationStrategies.getModuleStrategies(this.module.name);
        },
    },
    methods: {
        onPageLoaded(this: any, args) {
            // console.log("loaded", calibrationStrategies);
        },
        choose(this: any, strategy: CalibrationStrategy) {
            console.log("strategy", strategy);
            return this.$navigateTo(Calibrate, {
                props: {
                    stationId: this.stationId,
                    position: this.position,
                    strategy: strategy,
                },
            });
        },
        back(this: any) {
            console.log("Start::back", this.fromSettings);
            if (this.fromSettings) {
                return this.$navigateTo(StationSettingsModuleList, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            } else {
                return this.$navigateTo(Recalibrate, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "../app-variables";

.choice-heading {
}
.choice-why {
}
.strategy-container {
    margin-bottom: 10;
    border: 1px solid black;
    border-radius: 4px;
}
</style>
