<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,55">
            <ScrollView row="0">
                <StackLayout id="stations-list" class="m-y-10">
                    <ScreenHeader title="FieldKit Stations" :canNavigateBack="false" :canNavigateSettings="false" :bottomMargin="false" />

                    <StationsMap id="stations-map" :mappedStations="mappedStations" @open-modal="openModalMap" />

                    <NoStationsWannaAdd v-if="stations.length == 0" />

                    <GridLayout
                        v-for="(station, index) in stations"
                        :key="station.sortedIndex"
                        :id="'station-' + station.id"
                        rows="*,*"
                        columns="85*,15*"
                        class="station-container m-y-5 m-x-15 p-10"
                        orientation="vertical"
                        :automationText="'linkToStation' + index"
                        @tap="goToDetail($event, station)"
                    >
                        <Label row="0" col="0" :text="station.name" :class="'station-name ' + (station.connected ? '' : 'disconnected')" />
                        <Label
                            row="1"
                            col="0"
                            :text="getDeployStatus(station)"
                            :class="'m-t-5 ' + (station.connected ? '' : 'disconnected')"
                        />
                        <Image col="1" rowSpan="2" width="20" v-if="station.connected" src="~/images/Icon_Connected.png"></Image>
                        <Image col="1" rowSpan="2" width="20" v-if="!station.connected" src="~/images/Icon_not_Connected.png"></Image>
                    </GridLayout>
                </StackLayout>
            </ScrollView>
            <StackLayout horizontalAlignment="right" verticalAlignment="bottom">
                <Label text="dev" class="dev-link" @doubleTap="showDev" />
            </StackLayout>
            <!-- footer -->
            <ScreenFooter row="1" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";
import * as dialogs from "tns-core-modules/ui/dialogs";
import routes from "@/routes";
import * as animations from "./animations";

import { AvailableStation } from "@/store/types";

import ScreenHeader from "./ScreenHeader.vue";
import ScreenFooter from "./ScreenFooter.vue";
import NoStationsWannaAdd from "./NoStationsWannaAdd.vue";
import StationsMap from "./StationsMap.vue";
import MapModal from "./MapModal.vue";

export default Vue.extend({
    components: {
        ScreenHeader,
        ScreenFooter,
        NoStationsWannaAdd,
        StationsMap,
    },
    computed: {
        ...mapGetters({ stations: "availableStations", mappedStations: "mappedStations" }),
    },
    data() {
        return {};
    },
    watch: {},
    methods: {
        onPageLoaded() {},
        getDeployStatus(this: any, station: AvailableStation) {
            return station.deployStartTime ? _L("deployed", station.deployStartTime) : _L("readyToDeploy");
        },
        goToDetail(this: any, ev, station) {
            return Promise.all([
                animations.pressed(ev.object),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: station.id,
                    },
                }),
            ]);
        },
        showDev(this: any) {
            return dialogs
                .confirm({
                    title: _L("confirmViewDevMenu"),
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel"),
                })
                .then((yes) => {
                    if (yes) {
                        return this.$navigateTo(routes.developerMenu);
                    }
                });
        },
        openModalMap(this: any, ev) {
            return this.$showModal(MapModal, {
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
</style>
