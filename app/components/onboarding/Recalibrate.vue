<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="140,*,140">
            <GridLayout row="0" rows="auto, auto" columns="*" class="m-y-20">
                <StackLayout row="0" verticalAlignment="middle">
                    <Label class="title text-center" :text="currentStation.name" textWrap="true"></Label>
                </StackLayout>
                <GridLayout row="1" rows="auto, auto" columns="*,*" width="80%" class="m-t-10 m-b-20">
                    <Image row="0" colSpan="2" class="m-b-10 m-l-15 m-r-15" src="~/images/Icon_complete.png" v-if="completed" />
                    <Image row="0" colSpan="2" class="m-b-10 m-l-15 m-r-15" src="~/images/Icon_incomplete.png" v-else />
                    <Label row="1" col="0" horizontalAlignment="left" :text="_L('connect')" />
                    <Label row="1" col="1" horizontalAlignment="right" :text="_L('setup')" />
                </GridLayout>
            </GridLayout>

            <ScrollView row="1" v-if="modules.length > 0">
                <GridLayout rows="*" columns="*">
                    <StackLayout row="0" verticalAlignment="middle">
                        <Label class="instruction" :text="_L('startCalibrationStep1')" lineHeight="4" textWrap="true" />
                        <Label class="instruction" :text="_L('startCalibrationStep2')" lineHeight="4" textWrap="true" />

                        <GridLayout rows="auto" columns="*" class="m-t-10 m-x-20" v-for="(m, moduleIndex) in modules" :key="m.id">
                            <StackLayout class="bordered-container p-10" @tap="goToCalibration(m)">
                                <GridLayout rows="auto, auto" columns="15*,70*,15*">
                                    <Image rowSpan="2" col="0" width="40" horizontalAlignment="left" :src="m.image"></Image>
                                    <Label
                                        row="0"
                                        col="1"
                                        rowSpan="1"
                                        :text="m.name"
                                        verticalAlignment="middle"
                                        class="size-18"
                                        textWrap="true"
                                    />

                                    <template v-if="m.canCalibrate">
                                        <Label row="1" col="1" :text="_L('uncalibrated')" class="size-14 red-text" v-if="!m.isCalibrated" />
                                        <Label row="1" col="1" :text="_L('calibrated')" class="size-14 gray-text" v-if="m.isCalibrated" />
                                        <Image
                                            rowSpan="2"
                                            col="2"
                                            width="20"
                                            horizontalAlignment="right"
                                            src="~/images/Icon_Success.png"
                                            v-if="m.isCalibrated"
                                        />
                                    </template>
                                    <template v-else>
                                        <Label row="1" col="1" :text="_L('noCalibrationNeeded')" class="size-14 gray-text" />
                                        <Image rowSpan="2" col="2" width="20" horizontalAlignment="right" src="~/images/Icon_Success.png" />
                                    </template>
                                </GridLayout>
                            </StackLayout>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout row="2" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('done')" :isEnabled="true" @tap="goToStations" />
                <Label :text="_L('goToStations')" class="skip" @tap="goToStations" textWrap="true" />
            </StackLayout>

            <StackLayout row="0" rowSpan="3" v-if="loading" height="100%" backgroundColor="white" verticalAlignment="middle">
                <GridLayout rows="auto, auto" columns="*">
                    <StackLayout row="0" id="loading-circle-blue"></StackLayout>
                    <StackLayout row="0" id="loading-circle-white"></StackLayout>
                    <Label row="1" class="instruction m-t-30" :text="_L('fetchingStationInfo')" lineHeight="4" textWrap="true"></Label>
                </GridLayout>
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "../../wrappers/vue";
import routes from "../../routes";
import { _T } from "../../utilities";

import { ModuleCalibration } from "../../calibration/model";
import calibrationStrategies from "../../calibration/strategies";

export default Vue.extend({
    name: "Recalibrate",
    components: {},
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            loading: false,
        };
    },
    computed: {
        currentStation(this: any) {
            const station = this.$store.getters.legacyStations[this.stationId];
            if (!station) {
                throw new Error("no station");
            }
            return station;
        },
        modules(this: any): ModuleCalibration[] {
            console.log("modules", this.currentStation.modules);
            return this.currentStation.modules
                .filter((m) => !m.internal)
                .map((m) => {
                    const haveStrategies = calibrationStrategies.getModuleStrategies(m.name).length > 0;
                    return new ModuleCalibration(m, haveStrategies);
                });
        },
        completed(this: any) {
            return this.modules.filter((m) => m.needsCalibration).length == 0;
        },
    },
    methods: {
        onPageLoaded(this: any, args) {
            console.log("recalibrating", this.stationId);
            /*
            this.page = args.object;
            this.loadingWhite = this.page.getViewById("loading-circle-white");
            if (this.loadingWhite) {
                this.loadingWhite.animate({
                    rotate: 360,
                    duration: 1000,
                });
            }
			*/
        },
        goToStations(this: any) {
            return this.$navigateTo(routes.stations, {
                clearHistory: true,
                backstackVisible: false,
            });
        },
        goToCalibration(this: any, m: ModuleCalibration) {
            return this.$navigateTo(routes.calibration.start, {
                clearHistory: true,
                props: {
                    stationId: this.stationId,
                    position: m.position,
                },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "../../app-variables";

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

.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}

.gray-text {
    color: $fk-gray-hint;
}
.red-text {
    color: $fk-primary-red;
}
</style>
