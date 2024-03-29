<template>
    <Page @loaded="onPageLoaded" class="station-detail-container">
        <PlatformHeader :title="currentStation.name" :subtitle="getDeployedStatus()" :onSettings="goToSettings" />
        <GridLayout v-if="currentStation" :rows="notifications.length > 0 ? '*,35' : '*'" class="m-t-20">
            <ScrollView row="0" ref="scrollview">
                <GridLayout rows="*" columns="*">
                    <GridLayout row="0" col="0">
                        <StackLayout orientation="vertical">
                            <StationStatusBox order="1" :station="currentStation" @deploy-tapped="goToDeploy" />
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
                                    v-if="notes.completed && notes.completed > 0"
                                    col="2"
                                    :text="notes.completed + '% ' + _L('complete')"
                                    class="size-16 blue"
                                    verticalAlignment="middle"
                                />
                            </GridLayout>
                            <ModuleList order="3" :station="currentStation" />
                            <NoModulesWannaAdd
                                :stationId="currentStation.id"
                                :connected="currentStation.connected"
                                v-if="currentStation.modules.filter((item) => !item.internal).length === 0"
                            />
                        </StackLayout>
                    </GridLayout>
                    <AbsoluteLayout v-if="redirectedFromCalibration" row="0" col="0" class="text-center">
                        <GridLayout top="75" width="100%">
                            <StackLayout class="ready-to-deploy-dialog-container p-20">
                                <Image width="60" src="~/images/Icon_Success.png"></Image>
                                <Label :text="_L('readyToDeploy')" class="size-18 bold p-10 m-t-20" />
                                <Label :text="_L('readyToDeployBodyDialog')" class="size-16 p-10 m-t-10" textWrap="true" lineHeight="4" />
                                <Button class="btn btn-primary ready-to-deploy-button" :text="_L('viewChecklist')" @tap="onViewChecklist" />
                                <Label :text="_L('skipChecklist')" class="size-14 m-t-20" textWrap="true" @tap="onSkip" />
                            </StackLayout>
                        </GridLayout>
                    </AbsoluteLayout>
                    <AbsoluteLayout v-if="newlyDeployed" row="0" col="0" class="text-center">
                        <GridLayout top="75" width="100%">
                            <StackLayout class="deployed-dialog-container">
                                <Image width="60" src="~/images/Icon_Success.png"></Image>
                                <Label :text="_L('stationDeployed')" class="deployed-dialog-text" />
                            </StackLayout>
                        </GridLayout>
                    </AbsoluteLayout>
                    <AbsoluteLayout v-if="recentlyDisconnected" row="0" col="0" class="text-center">
                        <GridLayout top="75" width="100%">
                            <StackLayout class="deployed-dialog-container">
                                <Image width="60" src="~/images/Icon_Disconnected.png"></Image>
                                <Label :text="_L('stationDisconnected')" class="size-16 m-t-20" />
                            </StackLayout>
                        </GridLayout>
                    </AbsoluteLayout>
                </GridLayout>
            </ScrollView>
            <AbsoluteLayout
                height="100%"
                width="100%"
                v-if="currentSettings.help.tutorialGuide && !redirectedFromCalibration"
                class="tooltip-container"
            >
                <StationDetailTooltipView
                    :topPosition="30"
                    :leftPosition="200"
                    arrowDirection="up"
                    :instructionText="_L('tooltipText0')"
                    :showTooltip="tip === 0"
                    :class="tip === 0 ? 'active' : ''"
                    @next-tool-tip="nextTooltip"
                    @dismiss-tool-tips="dismissTooltip"
                />
                <StationDetailTooltipView
                    :topPosition="160"
                    :leftPosition="220"
                    arrowDirection="up"
                    :instructionText="_L('tooltipText1')"
                    :showTooltip="tip === 1"
                    :class="tip === 1 ? 'active' : ''"
                    @next-tool-tip="nextTooltip"
                    @dismiss-tool-tips="dismissTooltip"
                />
                <StationDetailTooltipView
                    :topPosition="170"
                    :leftPosition="120"
                    arrowDirection="up"
                    :instructionText="_L('tooltipText2')"
                    :showTooltip="tip === 2"
                    :class="tip === 2 ? 'active' : ''"
                    @next-tool-tip="nextTooltip"
                    @dismiss-tool-tips="dismissTooltip"
                />
                <StationDetailTooltipView
                    v-if="!currentStation.deployed"
                    :topPosition="220"
                    :leftPosition="240"
                    arrowDirection="up"
                    :instructionText="_L('tooltipText3')"
                    :showTooltip="tip === 3"
                    :class="tip === 3 ? 'active' : ''"
                    @next-tool-tip="nextTooltip"
                    @dismiss-tool-tips="dismissTooltip"
                />
                <StationDetailTooltipView
                    :topPosition="400"
                    :leftPosition="100"
                    arrowDirection="down"
                    :instructionText="_L('tooltipText4')"
                    :showTooltip="tip === 4"
                    :class="tip === 4 ? 'active' : ''"
                    :showNextButton="false"
                    @next-tool-tip="nextTooltip"
                    @dismiss-tool-tips="dismissTooltip"
                />
            </AbsoluteLayout>
            <NotificationFooter
                v-if="notifications.length > 0"
                row="1"
                :onClose="goToDetail"
                :notifications="notifications"
                :stationId="stationId"
            />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { Frames, pages } from "@/routes";
import { debug, _L, promiseAfter } from "@/lib";
import { Notes, Notification, LegacyStation } from "@/store";
import { ActionTypes } from "~/store/actions";
import * as animations from "./animations";
import SharedComponents from "@/components/shared";
import StationStatusBox from "./StationStatusBox.vue";
import ModuleList from "./ModuleList.vue";
import NoModulesWannaAdd from "./NoModulesWannaAdd.vue";
import NotificationFooter from "./NotificationFooter.vue";
import StationDetailTooltipView from "~/components/StationDetailTooltipView.vue";
import { Settings } from "~/store/modules/portal";
import { Utils } from "@nativescript/core";

export default Vue.extend({
    components: {
        ...SharedComponents,
        StationStatusBox,
        ModuleList,
        NoModulesWannaAdd,
        NotificationFooter,
        StationDetailTooltipView,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        redirectedFromDeploy: {
            type: Boolean,
            default: false,
        },
        redirectedFromCalibration: {
            type: Boolean,
            default: false,
        },
    },
    data(): {
        newlyDeployed: boolean;
        unwatch: Function;
        recentlyDisconnected: boolean;
        tip: number;
        lastTip: number;
        buttonsTappable: boolean;
    } {
        const settings: Settings = this.$s.state.portal.settings;
        return {
            newlyDeployed: false,
            unwatch: () => {},
            recentlyDisconnected: false,
            tip: 0,
            lastTip: 4,
            buttonsTappable: !(settings.help?.tutorialGuide || false),
        };
    },
    computed: {
        notifications(): Notification[] {
            return this.$s.state.notifications.notifications.filter(
                (item: Notification) => item.station?.id === this.stationId && !item.satisfiedAt && item.silenced === false
            );
        },
        isDeployed(): boolean {
            return this.currentStation.deployStartTime != null;
        },
        notes(): Notes {
            return this.$s.state.notes.stations[this.stationId];
        },
        currentStation(): LegacyStation {
            const station = this.$s.getters.legacyStations[this.stationId];
            if (!station) {
                debug.log(`missing legacyStation`, this.stationId);
                throw new Error(`missing legacyStation`);
            }
            return station;
        },
        currentSettings(): Settings {
            return this.$s.state.portal.settings;
        },
    },
    mounted(): void {
        debug.log("station-detail", this.stationId);
        void this.completeSetup();
    },
    async created(): Promise<void> {
        try {
            await this.$s.dispatch(ActionTypes.LOAD_NOTIFICATIONS);
        } catch (error) {
            debug.log(`station-detail:created: error loading notifications`, error);
        }

        /*
        this.unwatch = this.$s.watch(
            (state, getters) => getters.legacyStations[this.stationId].connected,
            (newValue, oldValue) => {
                if (newValue === false) {
                    this.recentlyDisconnected = true;

                    setTimeout(() => {
                        this.recentlyDisconnected = false;
                    }, 3000);
                }
            }
        );
		*/

        await this.generateNotificationsFromPortalErrors();
    },
    beforeDestroy(): void {
        this.unwatch();
    },
    methods: {
        async goBack(ev: Event): Promise<void> {
            if (this.buttonsTappable) {
                await Promise.all([
                    animations.pressed(ev),
                    this.$navigateTo(pages.StationListView, {
                        frame: Frames.Stations,
                        clearHistory: true,
                    }),
                ]);
            }
        },
        async goToDeploy(): Promise<void> {
            if (this.buttonsTappable) {
                await this.$navigateTo(pages.DeployMapView, {
                    frame: Frames.Stations,
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
        },
        async goToFieldNotes(): Promise<void> {
            if (this.buttonsTappable) {
                await this.$navigateTo(pages.DeployNotesView, {
                    frame: Frames.Stations,
                    props: {
                        stationId: this.stationId,
                        linkedFromStation: true,
                    },
                });
            }
        },
        async goToSettings(ev: Event): Promise<void> {
            if (this.buttonsTappable) {
                await Promise.all([
                    animations.pressed(ev),
                    this.$navigateTo(pages.StationSettings, {
                        frame: Frames.Stations,
                        props: {
                            stationId: this.currentStation.id,
                        },
                    }),
                ]);
            }
        },
        async goToDetail(ev: Event): Promise<void> {
            if (this.buttonsTappable) {
                await Promise.all([
                    animations.pressed(ev),
                    this.$navigateTo(pages.StationDetailView, {
                        frame: Frames.Stations,
                        props: {
                            stationId: this.currentStation.id,
                        },
                    }),
                ]);
            }
        },
        async addDeployedNotification(): Promise<void> {
            // TODO Eventually these shouldn't depend on the portal id for the user.
            if (!this.currentStation) return;
            await this.$s.dispatch(ActionTypes.ADD_NOTIFICATION, {
                key: `${this.currentStation.deviceId}/station-deployed`,
                kind: "station-deployed",
                created: new Date(),
                silenced: false,
                project: {},
                user: this.$s.state.portal.currentUser ? this.$s.state.portal.currentUser : {},
                station: this.currentStation,
                actions: {},
            });
        },
        async completeSetup(): Promise<void> {
            if (!this.currentStation) throw new Error(`no station`);

            if (this.redirectedFromDeploy) {
                this.newlyDeployed = true;

                await Promise.all([this.addDeployedNotification(), promiseAfter(3000)]).then(() => {
                    this.newlyDeployed = false;
                });
            }

            return;
        },
        getDeployedStatus(): string {
            return this.currentStation.deployStartTime ? _L("deployed", this.currentStation.deployStartTime) : _L("readyToDeploy");
        },
        async addModule(): Promise<void> {
            if (this.buttonsTappable) {
                await this.$navigateTo(pages.AddModuleView, {
                    frame: Frames.Stations,
                    clearHistory: true,
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
        },
        async generateNotificationsFromPortalErrors(): Promise<void> {
            const portalError = this.currentStation?.portalHttpError;

            if (portalError?.name) {
                await this.$s.dispatch(ActionTypes.ADD_NOTIFICATION, {
                    key: `${this.currentStation.deviceId}/${portalError.name}`,
                    kind: portalError.name,
                    created: new Date(),
                    silenced: false,
                    project: {},
                    user: this.$s.state.portal.currentUser ? this.$s.state.portal.currentUser : {},
                    station: this.currentStation,
                    actions: {},
                });
            }
        },
        nextTooltip() {
            this.tip = this.tip + (this.currentStation?.deployed && this.tip === 2 ? 2 : 1);
        },
        dismissTooltip() {
            (this.$refs.scrollview as any).nativeView.isScrollEnabled = true;
            this.buttonsTappable = true;
            if (this.currentSettings.help?.tutorialGuide) {
                this.currentSettings.help.tutorialGuide = false;
                this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
            }
            this.tip = 0;
        },
        onPageLoaded() {
            if (this.currentSettings.help?.tutorialGuide) {
                this.$nextTick(() => {
                    (this.$refs.scrollview as any).nativeView.scrollToVerticalOffset(0, false);
                    (this.$refs.scrollview as any).nativeView.isScrollEnabled = false;
                });
            }
        },
        onViewChecklist() {
            Utils.openUrl("https://www.fieldkit.org/product-guide/set-up-station/#ready-to-deploy");
        },
        async onSkip() {
            await this.$navigateTo(pages.StationDetailView, {
                frame: Frames.Stations,
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

.station-detail-container {
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
        color: $fk-primary-black;
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

    StationDetailTooltipView {
        z-index: 1;
    }
    .active {
        z-index: 99;
    }

    .ready-to-deploy-dialog-container {
        border-radius: 4;
        background-color: $white;
        color: $fk-circle-blue;
        border-color: $fk-gray-lighter;
        border-width: 1;
        width: 300;
        padding-top: 40;
    }

    .ready-to-deploy-button {
        margin-top: 50;
    }

    .tooltip-container {
        background-color: transparent;
    }
}
</style>
