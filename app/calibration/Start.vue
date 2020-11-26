<template>
    <Page>
        <Header :title="visual.title" :subtitle="visual.subtitle" :icon="visual.icon" @back="back" />
        <GridLayout rows="auto,*,auto">
            <ConnectionStatusHeader row="0" :connected="currentStation.connected" />
            <ChooseStrategy row="1" :moduleKey="moduleKey" :strategies="strategies" :visual="visual" :busy="busy" @selected="selected" />
            <StackLayout row="2">
                <Button class="btn btn-primary btn-padded" :text="visual.done" @tap="done" :isEnabled="currentStation.connected" />
            </StackLayout>
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
    data(): { busy: boolean; strategy: CalibrationStrategy | null } {
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
            if (!module) throw new Error("unable to find module");
            console.log("station-module", module.name);
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
            console.log(`common: ${this.moduleKey} ${JSON.stringify(common)}`);
            const visual = common[this.moduleKey];
            if (!visual) throw new Error(`missing common module visual: ${this.moduleKey}`);
            return visual;
        },
    },
    methods: {
        selected(strategy: CalibrationStrategy): void {
            console.log("strategy", strategy.id);
            this.strategy = strategy;
        },
        done(): Promise<any> {
            if (!this.strategy) {
                this.strategy = this.strategies[0];
            }
            return this.$navigateTo(Calibrate, {
                props: {
                    stationId: this.stationId,
                    position: this.position,
                    strategy: this.strategy,
                },
            });
        },
        back(): Promise<any> {
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
