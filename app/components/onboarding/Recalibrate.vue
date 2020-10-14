<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="auto,*,140">
            <GridLayout row="0" rows="auto,auto" columns="*" class="">
                <StackLayout row="0" verticalAlignment="middle">
                    <ConnectionStatusHeader :connected="currentStation.connected" />
                    <Label class="m-y-20 title text-center" :text="currentStation.name" textWrap="true"></Label>
                </StackLayout>
                <GridLayout row="1" rows="auto, auto" columns="*,*" width="80%" class="m-t-10 m-b-20">
                    <Image
                        row="0"
                        colSpan="2"
                        class="m-b-10 m-l-15 m-r-15"
                        src="~/images/Icon_complete.png"
                        v-if="currentStation.completed"
                    />
                    <Image row="0" colSpan="2" class="m-b-10 m-l-15 m-r-15" src="~/images/Icon_incomplete.png" v-else />
                    <Label row="1" col="0" horizontalAlignment="left" :text="_L('connect')" />
                    <Label row="1" col="1" horizontalAlignment="right" :text="_L('setup')" />
                </GridLayout>
            </GridLayout>

            <ScrollView row="1" v-if="currentStation.modules.length > 0">
                <GridLayout rows="*" columns="*">
                    <StackLayout row="0" verticalAlignment="middle">
                        <Label class="instruction" :text="_L('startCalibrationStep1')" lineHeight="4" textWrap="true" />
                        <Label class="instruction" :text="_L('startCalibrationStep2')" lineHeight="4" textWrap="true" />

                        <CalibratingModules :station="currentStation" @selected="calibrateModule" />
                    </StackLayout>
                </GridLayout>
            </ScrollView>
            <StackLayout row="1" v-else><!-- TODO No Modules --></StackLayout>

            <StackLayout row="2" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('done')" :isEnabled="true" @tap="goToStations" />
                <Label :text="_L('goToStations')" class="skip" @tap="goToStations" textWrap="true" />
            </StackLayout>

            <StackLayout row="0" rowSpan="3" v-if="loading" height="100%" backgroundColor="white" verticalAlignment="middle">
                <GridLayout rows="auto, auto" columns="*">
                    <StackLayout row="0" id="loading-circle-blue"></StackLayout>
                    <StackLayout row="0" id="loading-circle-white"></StackLayout>
                    <Label row="1" class="instruction m-t-30" :text="_L('fetchingStationInfo')" lineHeight="4" textWrap="true" />
                </GridLayout>
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "@/routes";
import { _T } from "@/utilities";
import { Station } from "@/store/types";

import { ModuleCalibration } from "@/calibration/model";

import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";
import CalibratingModules from "./CalibratingModules.vue";

export default Vue.extend({
    name: "Recalibrate",
    components: {
        ConnectionStatusHeader,
        CalibratingModules,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data(): { loading: boolean } {
        return {
            loading: false,
        };
    },
    computed: {
        currentStation(this: any): Station {
            return this.$store.getters.stationCalibrations[this.stationId];
        },
    },
    methods: {
        onPageLoaded(this: any, args): void {
            console.log("recalibrating", this.stationId);
        },
        goToStations(this: any): Promise<any> {
            return this.$navigateTo(routes.stations, {
                clearHistory: true,
                backstackVisible: false,
            });
        },
        calibrateModule(this: any, m: ModuleCalibration): Promise<any> {
            if (!this.currentStation.connected) {
                return Promise.resolve();
            }
            return this.$navigateTo(routes.calibration.start, {
                clearHistory: true,
                props: {
                    stationId: this.stationId,
                    position: m.position,
                    fromSettings: false,
                },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

#loading-circle-blue,
#loading-circle-white {
    width: 75;
    height: 75;
    background: $fk-gray-white;
    border-width: 2;
    border-radius: 60%;
}
#loading-circle-white {
    border-color: $fk-gray-white;
    clip-path: circle(100% at 50% 0);
}
#loading-circle-blue {
    border-color: $fk-secondary-blue;
}
.skip {
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
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
</style>
