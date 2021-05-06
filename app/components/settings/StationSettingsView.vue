<template>
    <Page>
        <PlatformHeader :title="_L('stationSettings.title')" :subtitle="stationName" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected">
            <GridLayout rows="*">
                <StackLayout row="0">
                    <SettingsItemText text="general" @tap="goToGeneral" />
                    <SettingsItemText text="networks" @tap="goToNetworks" />
                    <SettingsItemText text="firmware" @tap="goToFirmware" />
                    <SettingsItemText text="modulesTitle" @tap="goToModules" />
                    <SettingsItemText text="endDeployment" @tap="goToEndDeploy" />
                    <SettingsItemText text="forgetStation" @tap="forgetStationDialog" />
                </StackLayout>

                <DockLayout row="0" v-if="showForgetStationDialog" class="text-center">
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
        </StationSettingsLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import StationListView from "@/components/StationListView.vue";
import General from "./StationSettingsGeneral.vue";
import Networks from "./StationSettingsNetworks.vue";
import Firmware from "./StationSettingsFirmware.vue";
import Modules from "./StationSettingsModuleList.vue";
import EndDeploy from "./StationSettingsEndDeploy.vue";
import { ActionTypes, AvailableStation } from "@/store";
import Services from "@/services/singleton";

export default Vue.extend({
    data(): {
        loggedIn: boolean;
        showForgetStationDialog: boolean;
        stationName: string | null;
        forgotten: boolean;
    } {
        const station = this.$s.getters.availableStationsById[this.stationId];
        return {
            loggedIn: Services.PortalInterface().isLoggedIn(),
            showForgetStationDialog: false,
            stationName: station.name,
            forgotten: false,
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
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
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
                    bookmark: true,
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
            this.forgotten = true;
            await this.$navigateTo(StationListView, {
                clearHistory: true,
            });
            await this.$s.dispatch(ActionTypes.FORGET_STATION, this.station.id);
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
