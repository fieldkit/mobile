<template>
    <Page>
        <Header :title="visual.title" :subtitle="visual.subtitle" :icon="visual.icon" @back="back" />
        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="currentStation.connected" />
            <ChooseStrategy row="1" :moduleKey="moduleKey" :strategies="strategies" :visual="visual" :busy="busy" @choose="choose" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { _T } from "@/utilities";
import { Station, Module } from "@/store/types";

import Header from "./Header.vue";
import Calibrate from "./Calibrate.vue";
import ChooseStrategy from "./ChooseStrategy.vue";

import Recalibrate from "../components/onboarding/Recalibrate.vue";
import StationSettingsModuleList from "../components/settings/StationSettingsModuleList.vue";
import ConnectionStatusHeader from "../components/ConnectionStatusHeader.vue";

import { calibrationStrategies } from "./strategies";
import { CalibrationStrategy } from "./model";

import { Common } from "./water";

export default Vue.extend({
    name: "Start",
    components: {
        Header,
        ConnectionStatusHeader,
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
    data(): { busy: boolean } {
        return {
            busy: false,
        };
    },
    computed: {
        currentStation(this: any): Station {
            return this.$store.getters.stationCalibrations[this.stationId];
        },
        module(this: any): Module {
            const station: Station = this.$store.getters.stationsById[this.stationId];
            const module = station.modules.find((m) => m.position === this.position);
            if (!module) throw new Error("unable to find module");
            console.log("station-module", module.name);
            return module;
        },
        moduleKey(this: any): string {
            return this.module.name;
        },
        strategies(this: any): CalibrationStrategy[] {
            return calibrationStrategies().getModuleStrategies(this.moduleKey);
        },
        visual(this: any) {
            const common = Common();
            console.log("common", common, this.moduleKey);
            const visual = common[this.moduleKey];
            if (!visual) throw new Error(`missing common module visual: ${this.moduleKey}`);
            return visual;
        },
    },
    methods: {
        choose(this: any, strategy: CalibrationStrategy): Promise<any> {
            console.log("strategy", strategy);
            return this.$navigateTo(Calibrate, {
                props: {
                    stationId: this.stationId,
                    position: this.position,
                    strategy: strategy,
                },
            });
        },
        back(this: any): Promise<any> {
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
@import "~/_app-variables";

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
