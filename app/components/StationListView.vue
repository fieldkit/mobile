<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader title="FieldKit Stations" :canNavigateBack="false" :canNavigateSettings="false" />

        <GridLayout rows="*,55">
            <ScrollView row="0">
                <StackLayout id="stations-list" class="m-y-10" @doubleTap="onDoubleTap">
                    <StationsMap id="stations-map" :mappedStations="mappedStations" @toggle-modal="openModalMap" />

                    <NoStationsWannaAdd v-if="stations.length == 0" />

                    <GridLayout
                        v-for="(station, index) in stations"
                        :key="station.deviceId"
                        rows="*,*"
                        columns="85*,15*"
                        class="station-container m-y-5 m-x-15 p-10"
                        orientation="vertical"
                        @tap="goToDetail($event, station)"
                    >
                        <Label row="0" col="0" :text="station.name" :class="'station-name ' + (station.connected ? '' : 'disconnected')" />
                        <Label
                            row="1"
                            col="0"
                            :text="getDeployStatus(station)"
                            :class="'m-t-5 ' + (station.connected ? '' : 'disconnected')"
                        />
                        <Image col="1" rowSpan="2" width="20" v-if="station.connected" src="~/images/Icon_Connected.png" />
                        <Image col="1" rowSpan="2" width="20" v-if="!station.connected" src="~/images/Icon_not_Connected.png" />
                    </GridLayout>
                    <Label text="Double tap to scan for stations." textWrap="true" class="scan-notice" v-if="!scanning" />
                    <Label text="Scanning" textWrap="true" class="scan-notice" v-if="scanning" />
                </StackLayout>
            </ScrollView>
            <StackLayout horizontalAlignment="right" verticalAlignment="bottom">
                <Label text="dev" class="dev-link" @doubleTap="showDev" />
            </StackLayout>
            <ScreenFooter row="1" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";
import { Dialogs } from "@nativescript/core";
import routes from "@/routes";
import * as animations from "./animations";

import { AvailableStation } from "@/store";
import { ActionTypes } from "@/store/actions";

import SharedComponents from "@/components/shared";
import NoStationsWannaAdd from "./NoStationsWannaAdd.vue";
import StationsMap from "./StationsMap.vue";
import MapModal from "./MapModal.vue";

export default Vue.extend({
    components: {
        ...SharedComponents,
        NoStationsWannaAdd,
        StationsMap,
    },
    computed: {
        ...mapGetters({ stations: "availableStations", mappedStations: "mappedStations" }),
    },
    data(): { busy: boolean; scanning: boolean } {
        return {
            busy: false,
            scanning: false,
        };
    },
    watch: {},
    methods: {
        onPageLoaded(): void {},
        getDeployStatus(station: AvailableStation): string {
            return station.deployStartTime ? _L("deployed", station.deployStartTime) : _L("readyToDeploy");
        },
        async goToDetail(ev, station: AvailableStation): Promise<void> {
            await Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: station.id,
                    },
                }),
            ]);
        },
        async showDev(): Promise<void> {
            if (this.busy) {
                return Promise.resolve();
            }

            this.busy = true;

            await Dialogs.confirm({
                title: _L("confirmViewDevMenu"),
                okButtonText: _L("yes"),
                cancelButtonText: _L("cancel"),
            })
                .then((yes: boolean) => {
                    if (yes) {
                        return this.$navigateTo(routes.developerMenu, {});
                    }
                    return;
                })
                .finally(() => {
                    this.busy = false;
                });
        },
        onDoubleTap(): Promise<void> {
            this.scanning = true;
            return this.$s.dispatch(ActionTypes.SCAN_FOR_STATIONS).finally(() => {
                this.scanning = false;
            });
        },
        async openModalMap(ev: any): Promise<void> {
            await this.$showModal(MapModal, {
                fullscreen: true,
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.toggle-container {
    margin-bottom: 16;
    margin-right: 10;
}
.station-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.station-name {
    font-size: 18;
    color: $fk-primary-black;
}
.disconnected {
    color: $fk-gray-dark;
}
.stations-list {
    font-size: 16;
}
.dark {
    color: $fk-primary-black;
}
.instruction {
    color: $fk-primary-black;
    margin-left: 25;
    margin-right: 25;
    margin-bottom: 20;
    line-height: 4;
}

.dev-link {
    color: $fk-gray-lightest;
    padding: 10;
}

.scan-notice {
    padding-top: 30;
    color: #afafaf;
    text-align: center;
}
</style>
