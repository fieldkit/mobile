<template>
    <Page>
        <Header :title="visual.title" :subtitle="visual.subtitle" :icon="visual.icon" @back="back" />
        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="currentStation.connected" />
            <ChooseStrategy
                row="1"
                :moduleKey="moduleKey"
                :strategies="strategies"
                :visual="visual"
                :busy="busy"
                :enabled="currentStation.connected"
                @done="done"
                v-if="false"
            />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { _T } from "@/lib";
import { Station, Module } from "@/store/types";

import Header from "./Header.vue";
import Calibrate from "./Calibrate.vue";
import ChooseStrategy from "./ChooseStrategy.vue";

import Recalibrate from "../components/onboarding/Recalibrate.vue";
import StationSettingsModuleList from "../components/settings/StationSettingsModuleList.vue";
import ConnectionStatusHeader from "../components/ConnectionStatusHeader.vue";

import { calibrationStrategies } from "./strategies";
import { StationCalibration, CalibrationStrategy } from "./model";

import { CommonProperties, Common } from "./water";

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
            type: Boolean,
            default: true,
        },
    },
    data(): {
        busy: boolean;
        strategy: CalibrationStrategy | null;
    } {
        return {
            busy: false,
            strategy: null,
        };
    },
    computed: {
        currentStation(): StationCalibration {
            return this.$s.getters.stationCalibrations[this.stationId];
        },
        module(): Module {
            const station: Station = this.$s.getters.stationsById[this.stationId];
            const module = station.modules.find((m) => m.position === this.position);
            if (!module) throw new Error("unable to find module: ${module.name}");
            return module;
        },
        moduleKey(): string {
            return this.module.name;
        },
        strategies(): CalibrationStrategy[] {
            return calibrationStrategies().getModuleStrategies(this.moduleKey);
        },
        visual(): CommonProperties {
            const common = Common();
            const visual = common[this.moduleKey];
            if (!visual) throw new Error(`missing common module visual: ${this.moduleKey}`);
            return visual;
        },
    },
    mounted(): void {
        const strategies = this.strategies;
        if (strategies.length == 1) {
            this.$nextTick(async () => {
                await this.done(strategies[0]);
            });
        }
    },
    methods: {
        async done(strategy: CalibrationStrategy): Promise<void> {
            if (!strategy) throw new Error();
            console.log(`strategy: ${strategy.moduleKey} ${strategy.heading}`);
            this.strategy = strategy;
            await this.$navigateTo(Calibrate, {
                props: {
                    stationId: this.stationId,
                    position: this.position,
                    strategy: this.strategy,
                    fromSettings: this.fromSettings,
                },
            });
        },
        async back(): Promise<void> {
            console.log("Start::back", this.fromSettings);
            if (this.fromSettings) {
                await this.$navigateTo(StationSettingsModuleList, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            } else {
                await this.$navigateTo(Recalibrate, {
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

.strategy-container {
    margin-bottom: 10;
    border: 1px solid black;
    border-radius: 4px;
}
</style>
