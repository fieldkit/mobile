<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout :rows="notificationCodes.length > 0 ? '*,35,55' : '*,55'" v-if="currentStation">
            <ScrollView row="0">
                <StackLayout orientation="vertical">
                    <ScreenHeader
                        order="1"
                        :title="currentStation.name"
                        :subtitle="getDeployedStatus()"
                        :onBack="goBack"
                        :onSettings="goToSettings"
                    />

                    <GridLayout order="3" rows="*" columns="*">
                        <GridLayout row="0" col="0">
                            <StackLayout orientation="vertical">
                                <StationStatusBox order="1" @deployTapped="goToDeploy" :station="currentStation" />
                                <GridLayout
                                    order="2"
                                    rows="auto"
                                    columns="10*,55*,35*"
                                    v-if="isDeployed"
                                    class="m-t-5 m-b-10 m-x-10 p-10 bordered-container"
                                    @tap="goToFieldNotes"
                                >
                                    <Image col="0" width="25" src="~/images/Icon_FieldNotes.png"></Image>
                                    <Label col="1" :text="_L('fieldNotes')" class="size-16 m-l-10" verticalAlignment="middle" />
                                    <Label
                                        col="2"
                                        :text="notes.completed + '% ' + _L('complete')"
                                        class="size-16 blue"
                                        verticalAlignment="middle"
                                        v-if="notes.completed && notes.completed > 0"
                                    />
                                </GridLayout>
                                <ModuleListView order="3" :station="currentStation" @moduleTapped="goToModule" />
                            </StackLayout>
                        </GridLayout>

                        <AbsoluteLayout row="0" col="0" class="text-center" v-if="newlyDeployed">
                            <GridLayout top="75" width="100%">
                                <StackLayout class="deployed-dialog-container">
                                    <Image width="60" src="~/images/Icon_Success.png"></Image>
                                    <Label :text="_L('stationDeployed')" class="deployed-dialog-text" />
                                </StackLayout>
                            </GridLayout>
                        </AbsoluteLayout>
                    </GridLayout>
                </StackLayout>
            </ScrollView>

            <NotificationFooter row="1" :onClose="goToDetail" :notificationCodes="notificationCodes" v-if="notificationCodes.length > 0" />
            <ScreenFooter :row="notificationCodes.length > 0 ? '2' : '1'" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";

import * as animations from "./animations";

import StationStatusBox from "./StationStatusBox";
import ModuleListView from "./ModuleListView";
import NotificationFooter from "./NotificationFooter";
import ScreenHeader from "./ScreenHeader";
import ScreenFooter from "./ScreenFooter";

export default {
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        redirectedFromDeploy: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            newlyDeployed: false,
        };
    },
    computed: {
        notificationCodes() {
            const codes = [];
            const portal = this.currentStation.portalHttpError;
            if (portal && portal.name) {
                codes.push(portal.name);
            }
            return codes;
        },
        isDeployed() {
            return this.currentStation.deployStartTime != null;
        },
        notes() {
            return this.$store.state.notes.stations[this.stationId];
        },
        currentStation() {
            if (!this.$store.getters.legacyStations) {
                throw new Error(`missing legacyStations`);
            }
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    components: {
        ScreenHeader,
        StationStatusBox,
        ModuleListView,
        NotificationFooter,
        ScreenFooter,
    },
    methods: {
        onPageLoaded(args) {
            console.log("loading station detail");

            this.completeSetup();

            console.log("loaded station detail", this.stationId);
        },
        goBack(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stations, {
                    props: {
                        stationId: this.stationId,
                    },
                    transition: {
                        name: "slideRight",
                        duration: 250,
                        curve: "linear",
                    },
                }),
            ]);
        },
        goToDeploy(ev) {
            return this.$navigateTo(routes.deploy.start, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        goToFieldNotes() {
            return this.$navigateTo(routes.deploy.notes, {
                props: {
                    stationId: this.stationId,
                    linkedFromStation: true,
                },
            });
        },
        goToModule(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.module, {
                    props: {
                        // remove the "m_id-" prefix
                        stationId: this.currentStation.id,
                        moduleId: event.object.id.split("m_id-")[1],
                        station: this.currentStation,
                    },
                }),
            ]);
        },
        goToSettings(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationSettings, {
                    props: {
                        stationId: this.currentStation.id,
                        station: this.currentStation,
                    },
                }),
            ]);
        },
        goToDetail(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.currentStation.id,
                    },
                }),
            ]);
        },
        stopProcesses() {
            if (this.intervalTimer) {
                clearInterval(this.intervalTimer);
            }
            if (this.$refs.statusBox) {
                this.$refs.statusBox.stopProcesses();
            }
        },
        onUnloaded() {
            this.stopProcesses();
        },
        completeSetup() {
            this.loading = false;

            if (this.redirectedFromDeploy) {
                this.newlyDeployed = true;
                return Promise.delay(3000).then(() => {
                    this.newlyDeployed = false;
                });
            }

            return Promise.resolve();
        },
        getDeployedStatus() {
            return this.currentStation.deployStartTime ? _L("deployed", this.currentStation.deployStartTime) : _L("readyToDeploy");
        },
    },
};
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.blue {
    color: $fk-primary-blue;
}

.deployed-dialog-container {
    border-radius: 4;
    background-color: $fk-gray-lightest;
    border-color: $fk-gray-lighter;
    border-width: 1;
    width: 225;
    height: 225;
    padding-top: 50;
}
.deployed-dialog-text {
    margin-top: 20;
    font-size: 18;
}
</style>
