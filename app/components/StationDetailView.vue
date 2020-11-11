<template>
    <Page>
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
                            <GridLayout
                                rows="auto,30,60,auto"
                                columns="*"
                                class="m-10 text-center bordered-container p-b-20"
                                v-if="currentStation.modules.filter(item => !item.internal).length === 0"
                            >
                                <Image row="0" src="~/images/Icon_Warning_error.png" class="small"></Image>
                                <Label row="1" :text="_L('noModulesAttachedTitle')" class="size-18 bold"></Label>
                                <Label row="2" :text="_L('noModulesAttachedBody')" class="size-16" width="260" textWrap="true"></Label>
                                <Button
                                    row="3"
                                    class="btn btn-primary btn-padded m-30"
                                    :text="_L('addModules')"
                                    :isEnabled="true"
                                    @tap="addModule"
                                />
                            </GridLayout>
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

import { Station, Notes, Notification } from "@/store";

import SharedComponents from "@/components/shared";
import StationStatusBox from "./StationStatusBox.vue";
import ModuleList from "./ModuleList.vue";
import NotificationFooter from "./NotificationFooter.vue";
import { ActionTypes } from "~/store/actions";

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
        notifications(): Notification[] {
            return this.$s.state.notifications.notifications;
        },
        isDeployed(): boolean {
            return this.currentStation.deployStartTime != null;
        },
        notes(): Notes {
            return this.$s.state.notes.stations[this.stationId];
        },
        currentStation(): Station {
            const station = this.$s.getters.legacyStations[this.stationId];
            if (!station) {
                console.log(`missing legacyStation`, this.stationId);
                throw new Error(`missing legacyStation`);
            }
            return station;
        },
    },
    components: {
        ...SharedComponents,
        StationStatusBox,
        ModuleList,
        NotificationFooter,
    },
    mounted() {
        console.log("loading station detail", this.stationId);
        this.completeSetup();
        console.log("loaded station detail", this.stationId);
    },
    methods: {
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
        addDeployedNotification(): Promise<void> {
            if (!this.$s.state.portal.currentUser) {
                return Promise.resolve();
            }
            return this.$s.dispatch(ActionTypes.ADD_NOTIFICATION, {
                key: `${this.$s.state.portal.currentUser.portalId}/${this.currentStation.id}/station-deployed`,
                kind: "station-deployed",
                created: new Date(),
                silenced: "false",
                project: {},
                user: this.$s.state.portal.currentUser,
                station: this.currentStation,
                actions: {},
            });
        },
        completeSetup(): Promise<void> {
            if (!this.currentStation) throw new Error(`no station`);

            if (this.redirectedFromDeploy) {
                this.newlyDeployed = true;

                return Promise.all([this.addDeployedNotification(), promiseAfter(3000)]).then(() => {
                    this.newlyDeployed = false;
                });
            }

            return Promise.resolve();
        },
        getDeployedStatus(): string {
            return this.currentStation.deployStartTime ? _L("deployed", this.currentStation.deployStartTime) : _L("readyToDeploy");
        },
        addModule() {
            return this.$navigateTo(routes.onboarding.addModule, {
                clearHistory: true,
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

.small {
    width: 50;
    margin: 20;
}
</style>
