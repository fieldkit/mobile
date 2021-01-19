<template>
    <Page @loaded="onPageLoaded">
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
                            <GridLayout
                                v-if="currentStation.modules.filter((item) => !item.internal).length === 0"
                                rows="auto,30,60,auto"
                                columns="*"
                                class="m-10 text-center bordered-container p-b-20"
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
            <AbsoluteLayout height="100%" width="100%" v-if="currentSettings.help.tutorial_guide">
                <StationDetailTooltipView
                    topPosition="170"
                    leftPosition="120"
                    arrowDirection="up"
                    :instructionText="_L('tooltipText1')"
                    :showTooltip="tip === 0"
                    :class="tip === 0 ? 'active' : ''"
                    @nextTooltip="nextTooltip"
                    @dismissTooltips="dismissTooltip"
                ></StationDetailTooltipView>
                <StationDetailTooltipView
                    topPosition="220"
                    leftPosition="240"
                    arrowDirection="up"
                    :instructionText="_L('tooltipText2')"
                    :showTooltip="tip === 1"
                    :class="tip === 1 ? 'active' : ''"
                    @nextTooltip="nextTooltip"
                    @dismissTooltips="dismissTooltip"
                ></StationDetailTooltipView>
                <StationDetailTooltipView
                    topPosition="30"
                    leftPosition="200"
                    arrowDirection="up"
                    :instructionText="_L('tooltipText3')"
                    :showTooltip="tip === 2"
                    :class="tip === 2 ? 'active' : ''"
                    @nextTooltip="nextTooltip"
                    @dismissTooltips="dismissTooltip"
                ></StationDetailTooltipView>
                <StationDetailTooltipView
                    topPosition="510"
                    leftPosition="100"
                    arrowDirection="down"
                    :instructionText="_L('tooltipText4')"
                    :showTooltip="tip === 3"
                    :class="tip === 3 ? 'active' : ''"
                    :showNextButton="false"
                    @nextTooltip="nextTooltip"
                    @dismissTooltips="dismissTooltip"
                ></StationDetailTooltipView>
            </AbsoluteLayout>

            <NotificationFooter v-if="notifications.length > 0" row="1" :onClose="goToDetail" :notifications="notifications" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "@/routes";
import { promiseAfter } from "@/utilities";
import { Station, Notes, Notification } from "@/store";
import { ActionTypes } from "~/store/actions";
import * as animations from "./animations";
import SharedComponents from "@/components/shared";
import StationStatusBox from "./StationStatusBox.vue";
import ModuleList from "./ModuleList.vue";
import NotificationFooter from "./NotificationFooter.vue";
import StationDetailTooltipView from "~/components/StationDetailTooltipView.vue";
import { Settings } from "~/store/modules/portal";

export default Vue.extend({
    components: {
        ...SharedComponents,
        StationStatusBox,
        ModuleList,
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
    },
    data(): {
        newlyDeployed: boolean;
        unwatch: Function;
        recentlyDisconnected: boolean;
        tip: number;
        lastTip: number;
        buttonsTappable: boolean;
    } {
        return {
            newlyDeployed: false,
            unwatch: () => {},
            recentlyDisconnected: false,
            tip: 0,
            lastTip: 3,
            buttonsTappable: false,
        };
    },
    computed: {
        notifications(): Notification[] {
            return this.$s.state.notifications.notifications.filter((item: Notification) => item.silenced === false);
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
        currentSettings(): Settings {
            return this.$s.state.portal.settings;
        },
    },
    mounted(): void {
        console.log("station-detail", this.stationId);
        void this.completeSetup();
    },
    async created(): Promise<void> {
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
                    this.$navigateTo(routes.stations, {
                        clearHistory: true,
                    }),
                ]);
            }
        },
        async goToDeploy(): Promise<void> {
            if (this.buttonsTappable) {
                await this.$navigateTo(routes.deploy.start, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
        },
        async goToFieldNotes(): Promise<void> {
            if (this.buttonsTappable) {
                await this.$navigateTo(routes.deploy.notes, {
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
                    this.$navigateTo(routes.stationSettings, {
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
                    this.$navigateTo(routes.stationDetail, {
                        props: {
                            stationId: this.currentStation.id,
                        },
                    }),
                ]);
            }
        },
        async addDeployedNotification(): Promise<void> {
            // TODO Eventually these shouldn't depend on the portal id for the user.
            if (!this.$s.state.portal.currentUser) return;
            const userId = this.$s.state.portal.currentUser.portalId;
            const stationId = this.currentStation.id;
            if (!stationId || !userId) return;
            await this.$s.dispatch(ActionTypes.ADD_NOTIFICATION, {
                key: `${userId}/${stationId}/station-deployed`,
                kind: "station-deployed",
                created: new Date(),
                silenced: false,
                project: {},
                user: this.$s.state.portal.currentUser,
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
                await this.$navigateTo(routes.onboarding.addModule, {
                    clearHistory: true,
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
        },
        async generateNotificationsFromPortalErrors(): Promise<void> {
            const portalError = this.currentStation?.portalHttpError;

            if (this.$s.state.portal.currentUser && portalError?.name) {
                const userId = this.$s.state.portal.currentUser.portalId;
                const stationId = this.currentStation.id;

                await this.$s.dispatch(ActionTypes.ADD_NOTIFICATION, {
                    key: `${userId}/${stationId}/${portalError.name}`,
                    kind: portalError.name,
                    created: new Date(),
                    silenced: false,
                    project: {},
                    user: this.$s.state.portal.currentUser,
                    station: this.currentStation,
                    actions: {},
                });
            }
        },
        nextTooltip() {
            this.tip++;
            if (this.lastTip < this.tip) {
                this.dismissTooltip();
                this.tip = 0;
            }
        },
        dismissTooltip() {
            (this.$refs.scrollview as any).nativeView.isScrollEnabled = true;
            this.buttonsTappable = true;

            if (this.currentSettings.help?.tutorial_guide) {
                this.currentSettings.help.tutorial_guide = false;
                this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
            }
        },
        onPageLoaded() {
            if (this.currentSettings.help?.tutorial_guide) {
                (this.$refs.scrollview as any).nativeView.isScrollEnabled = false;
            }
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
</style>
