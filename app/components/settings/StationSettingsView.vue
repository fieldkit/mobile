<template>
    <Page>
        <PlatformHeader :title="_L('stationSettings.title')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
                <StackLayout class="p-t-10">
                    <StackLayout :class="station.connected ? 'm-t-5' : ''">
                        <Label
                            v-for="(option, i) in menuOptions"
                            :key="option"
                            :class="'menu-text size-18 ' + (i == menuOptions.length - 1 ? 'bottom-border' : '')"
                            :text="option"
                            textWrap="true"
                            @tap="selectFromMenu"
                        />
                        <Label
                            :class="'menu-text size-18 bottom-border forget-station'"
                            :text="_L('forgetStation')"
                            textWrap="true"
                            @tap="forgetStationDialog"
                        />
                    </StackLayout>
                </StackLayout>
            </ScrollView>

            <DockLayout row="1" v-if="showForgetStationDialog" class="text-center">
                <GridLayout rows="auto,auto,auto" dock="center" class="deployed-dialog-container" verticalAlignment="center">
                    <Label row="0" :text="_L('forgetStationTitle')" class="size-16 bold" />
                    <Label row="1" :text="_L('forgetStationBody')" class="size-16 m-t-20 m-b-20" textWrap="true" />
                    <GridLayout row="2" columns="*,*">
                        <Label col="0" :text="_L('forgetStationOK')" class="size-16 m-t-10 bold" @tap="forgetStation" />
                        <Label col="1" :text="_L('forgetStationCancel')" class="size-16 m-t-10 bold" @tap="cancelForgetStation" />
                    </GridLayout>
                </GridLayout>
            </DockLayout>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import Services from "@/services/singleton";
import SharedComponents from "@/components/shared";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";
import General from "./StationSettingsGeneral.vue";
import Networks from "./StationSettingsNetworks.vue";
import Firmware from "./StationSettingsFirmware.vue";
import Modules from "./StationSettingsModuleList.vue";
import EndDeploy from "./StationSettingsEndDeploy.vue";
import * as animations from "@/components/animations";
import { ActionTypes, AvailableStation } from "@/store";
import StationListView from "~/components/StationListView.vue";
import { promiseAfter } from "@/lib";

export default Vue.extend({
    data(): {
        loggedIn: boolean;
        menuOptions: string[];
        showForgetStationDialog: boolean;
    } {
        return {
            loggedIn: Services.PortalInterface().isLoggedIn(),
            menuOptions: [_L("general"), _L("networks"), _L("firmware"), _L("modulesTitle")],
            showForgetStationDialog: false,
        };
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    components: {
        ...SharedComponents,
        General,
        Firmware,
        Networks,
        ConnectionStatusHeader,
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        selectFromMenu(ev: Event): Promise<void> {
            void animations.pressed(ev);

            switch ((ev as any).object.text) {
                case _L("general"):
                    return this.goToGeneral();
                case _L("networks"):
                    return this.goToNetworks();
                case _L("firmware"):
                    return this.goToFirmware();
                case _L("modulesTitle"):
                    return this.goToModules();
                case _L("endDeployment"):
                    return this.goToEndDeploy();
            }

            throw new Error("unknown option");
        },
        async goToGeneral(): Promise<void> {
            await this.$navigateTo(General, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToNetworks(): Promise<void> {
            await this.$navigateTo(Networks, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToFirmware(): Promise<void> {
            await this.$navigateTo(Firmware, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToModules(): Promise<void> {
            await this.$navigateTo(Modules, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToEndDeploy(): Promise<void> {
            await this.$navigateTo(EndDeploy, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        forgetStationDialog(): void {
            this.showForgetStationDialog = true;
        },
        async forgetStation(): Promise<void> {
            this.showForgetStationDialog = false;
            await this.$navigateTo(StationListView, {
                clearHistory: true,
            });
            void promiseAfter(1000).then(() => this.$s.dispatch(ActionTypes.FORGET_STATION, this.station.id));
        },
        cancelForgetStation(): void {
            this.showForgetStationDialog = false;
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.menu-text {
    padding-left: 5;
    padding-top: 20;
    padding-bottom: 20;
    margin-left: 10;
    margin-right: 10;
    border-color: $fk-gray-lighter;
    border-top-width: 1;
}
.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.forget-station {
    border-bottom-color: $fk-tertiary-red;
    color: $fk-tertiary-red;
}

.full-width {
    width: 100%;
    margin-bottom: 10;
}

.deployed-dialog-container {
    color: $fk-tertiary-red;
    border-color: $fk-tertiary-red;
    border-width: 1;
    width: 300;
    background-color: $background;
    padding: 20;
}

.deployed-dialog-text {
    margin-top: 20;
    font-size: 18;
}
</style>
