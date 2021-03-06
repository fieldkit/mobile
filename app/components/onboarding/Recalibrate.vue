<template>
    <Page actionBarHidden="true">
        <GridLayout rows="auto,*">
            <GridLayout row="0" rows="auto,auto">
                <StackLayout row="0" verticalAlignment="middle">
                    <ConnectionStatusHeader :connected="station.connected" />
                    <Label class="m-y-20 title text-center" :text="station.name" textWrap="true"></Label>
                </StackLayout>
                <GridLayout row="1" rows="auto, auto" columns="*,*" width="80%" class="m-t-10 m-b-20">
                    <Image
                        row="0"
                        colSpan="2"
                        class="m-b-10 m-l-15 m-r-15"
                        src="~/images/Icon_complete.png"
                        v-if="station.completed && station.modules.length > 0"
                    />
                    <Image row="0" colSpan="2" class="m-b-10 m-l-15 m-r-15" src="~/images/Icon_incomplete.png" v-else />
                    <Label row="1" col="0" horizontalAlignment="left" :text="_L('connect')" />
                    <Label row="1" col="1" horizontalAlignment="right" :text="_L('setup')" />
                </GridLayout>
            </GridLayout>
            <SkipLayout
                row="1"
                :buttonLabel="_L('done')"
                :buttonEnabled="done"
                @button="goToDetails"
                :skipLabel="done ? _L('goToStations') : _L('setupLater')"
                @skip="skipToStations"
                :scrollable="true"
            >
                <StackLayout v-if="station.modules.length > 0">
                    <GridLayout rows="*" columns="*">
                        <StackLayout row="0" verticalAlignment="middle">
                            <Label class="instruction" :text="_L('startCalibrationStep1')" lineHeight="4" textWrap="true" />
                            <Label class="instruction" :text="_L('startCalibrationStep2')" lineHeight="4" textWrap="true" />

                            <CalibratingModules :station="station" @selected="calibrateModule" />
                        </StackLayout>
                    </GridLayout>
                </StackLayout>

                <StackLayout v-else>
                    <NoModulesWannaAdd :connected="station.connected" :stationId="stationId" />
                    <Label :text="_L('skipStep')" class="skip" @tap="goToDetails" textWrap="true" />
                </StackLayout>
            </SkipLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { routes, fullRoutes } from "@/routes";
import { StationCalibration, ModuleCalibration } from "@/calibration";
import { makeCalibrationRoute } from "@/calibration/start-calibrate";
import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";
import CalibratingModules from "./CalibratingModules.vue";
import NoModulesWannaAdd from "@/components/NoModulesWannaAdd.vue";
import { ActionTypes, LegacyStation } from "~/store";

export default Vue.extend({
    name: "Recalibrate",
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
    data(): {} {
        return {};
    },
    computed: {
        station(): StationCalibration {
            return this.$s.getters.stationCalibrations[this.stationId];
        },
        legacyStation(): LegacyStation {
            const station = this.$s.getters.legacyStations[this.stationId];
            if (!station) {
                console.log(`missing legacyStation`, this.stationId);
                throw new Error(`missing legacyStation`);
            }
            return station;
        },
        done(): boolean {
            return !this.station.modules.find((item) => item.canCalibrate && item.needsCalibration);
        },
    },
    methods: {
        async goToStations(): Promise<void> {
            await this.$deprecatedNavigateTo(fullRoutes.tabbed, {});
        },
        async skipToStations(): Promise<void> {
            await this.$s.dispatch(ActionTypes.ADD_NOTIFICATION, {
                key: `${this.legacyStation.deviceId}/calibration-before-deployment`,
                kind: "calibration-before-deployment",
                created: new Date(),
                silenced: false,
                project: {},
                user: this.$s.state.portal.currentUser ? this.$s.state.portal.currentUser : {},
                station: this.legacyStation,
                actions: {},
            });

            await this.goToStations();
        },
        async goToDetails(): Promise<void> {
            await this.$deprecatedNavigateTo(routes.station.detail, {
                props: {
                    stationId: this.station.id,
                    redirectedFromCalibration: !this.station.modules.find((item) => !item.isCalibrated),
                },
            });
        },
        async calibrateModule(moduleCal: ModuleCalibration): Promise<void> {
            if (!this.station.connected) {
                return Promise.resolve();
            }
            const route = await makeCalibrationRoute(this.station, moduleCal);
            await this.$deprecatedNavigateTo(route);
        },
        async addModule(): Promise<void> {
            await this.$deprecatedNavigateTo(routes.onboarding.addModule, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
.skip {
    padding-top: 10;
    padding-bottom: 10;
    font-size: 14;
    font-weight: bold;
    text-align: center;
    margin: 10;
}

.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}

.small {
    width: 50;
    margin: 20;
}
</style>
