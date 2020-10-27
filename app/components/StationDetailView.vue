<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="currentStation.name" :subtitle="getDeployedStatus()" :onBack="goBack" :onSettings="goToSettings" />
        <GridLayout :rows="notifications.length > 0 ? '*,35,55' : '*,55'" v-if="currentStation">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*">
                    <GridLayout row="0" col="0">
                        <StackLayout orientation="vertical">
                            <StationStatusBox order="1" @deployTapped="goToDeploy" :station="currentStation" />
                            <GridLayout
                                order="2"
                                rows="auto"
                                columns="10*,55*,35*"
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
                            <ModuleList order="3" :station="currentStation" />
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
            </ScrollView>

            <NotificationFooter row="1" :onClose="goToDetail" :notifications="notifications" v-if="notifications.length > 0" />
            <ScreenFooter :row="notifications.length > 0 ? '2' : '1'" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "@/routes";
import { promiseAfter } from "@/utilities";

import * as animations from "./animations";

import { Station, Notes } from "@/store";

import SharedComponents from "@/components/shared";
import StationStatusBox from "./StationStatusBox.vue";
import ModuleList from "./ModuleList.vue";
import NotificationFooter from "./NotificationFooter.vue";
import * as ActionTypes from "~/store/actions";

export default Vue.extend({
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
    data(): { newlyDeployed: boolean } {
        return {
            newlyDeployed: false,
        };
    },
    computed: {
        notifications(): string[] {
            return this.$store.state.notifications.notifications;
        },
        isDeployed(): boolean {
            return this.currentStation.deployStartTime != null;
        },
        notes(): Notes {
            return this.$store.state.notes.stations[this.stationId];
        },
        currentStation(): Station {
            if (!this.$store.getters.legacyStations) {
                throw new Error(`missing legacyStations`);
            }
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    components: {
        ...SharedComponents,
        StationStatusBox,
        ModuleList,
        NotificationFooter,
    },
    methods: {
        onPageLoaded(this: any, args): void {
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
        goToDeploy() {
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
        completeSetup() {
            if (this.redirectedFromDeploy) {
                this.newlyDeployed = true;

                return Promise.all([
                    this.$store.dispatch(ActionTypes.ADD_NOTIFICATION, {
                        key: `${this.$store.state.portal.currentUser.id}/${this.currentStation.id}/station-deployed`,
                        kind: "station-deployed",
                        created: new Date(),
                        silenced: "false",
                        project: {},
                        user: this.$store.state.portal.currentUser,
                        station: this.currentStation,
                        actions: {},
                    }),
                    promiseAfter(3000)
                ]).then(() => {
                    this.newlyDeployed = false;
                });
            }

            return Promise.resolve();
        },
        getDeployedStatus(): string {
            return this.currentStation.deployStartTime ? _L("deployed", this.currentStation.deployStartTime) : _L("readyToDeploy");
        },
    },
});
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
