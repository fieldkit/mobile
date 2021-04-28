<template>
    <Page>
        <PlatformHeader title="FieldKit Stations" :canNavigateBack="false" :canNavigateSettings="false" />

        <ScrollView>
            <StackLayout id="stations-list" class="m-y-10" @doubleTap="onDoubleTap">
                <StationsMap id="stations-map" :mappedStations="mappedStations" @toggle-modal="openModalMap" />

                <NoStationsWannaAdd v-if="discovering.length == 0 && stations.length == 0" />

                <ActivityIndicator v-if="discovering.length > 0" busy="true"></ActivityIndicator>

                <GridLayout
                    v-for="station in stations"
                    :key="station.deviceId"
                    rows="*,*"
                    columns="85*,15*"
                    class="station-container m-y-5 m-x-15 p-10"
                    orientation="vertical"
                    @tap="goToDetail($event, station)"
                >
                    <Label row="0" col="0" :text="station.name" :class="'station-name ' + (station.connected ? '' : 'disconnected')" />
                    <Label row="1" col="0" :text="getDeployStatus(station)" :class="'m-t-5 ' + (station.connected ? '' : 'disconnected')" />
                    <Image v-if="station.connected" col="1" rowSpan="2" width="37" src="~/images/Icon_Connected_AP.png" />
                    <Image v-if="!station.connected" col="1" rowSpan="2" width="37" src="~/images/Icon_Wifi_Not_Connected.png" />
                </GridLayout>
                <Label v-if="!scanning" text="Double tap to scan for stations." textWrap="true" class="scan-notice" />
                <Label v-if="scanning" text="Scanning" textWrap="true" class="scan-notice" />
            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";
import { routes } from "@/routes";
import SharedComponents from "@/components/shared";
import NoStationsWannaAdd from "./NoStationsWannaAdd.vue";
import StationsMap from "./StationsMap.vue";
import MapModal from "./MapModal.vue";
import * as animations from "./animations";
import { AvailableStation, DiscoveringStation, ScanForStationsAction } from "@/store";
import { _L, uuidv4 } from "@/lib";

export default Vue.extend({
    name: "StationListView",
    components: {
        ...SharedComponents,
        NoStationsWannaAdd,
        StationsMap,
    },
    data(): {
        busy: boolean;
        scanning: boolean;
        key: string;
    } {
        return {
            busy: false,
            scanning: false,
            key: uuidv4(),
        };
    },
    computed: {
        ...mapGetters({ stations: "availableStations", mappedStations: "mappedStations" }),
        discovering(): DiscoveringStation[] {
            return this.$s.getters.discovering;
        },
    },
    mounted(): void {
        console.log(this.key, "stations: mounted");
    },
    updated(): void {
        console.log(this.key, "stations: updated");
    },
    methods: {
        getDeployStatus(station: AvailableStation): string {
            return station.deployStartTime ? _L("deployed", station.deployStartTime) : _L("readyToDeploy");
        },
        async goToDetail(ev, station: AvailableStation): Promise<void> {
            if (!station.id) throw new Error(`missing station id: ${station.name || "<NONE>"}`);
            await Promise.all([
                animations.pressed(ev),
                // eslint-disable-next-line
                this.$navigateTo(routes.station.detail, {
                    props: {
                        stationId: station.id,
                    },
                }),
            ]);
        },
        async onDoubleTap(): Promise<void> {
            this.scanning = true;
            console.log(`user initiated station scan`);
            await this.$s.dispatch(new ScanForStationsAction({ user: true })).finally(() => {
                this.scanning = false;
            });
        },
        async openModalMap(): Promise<void> {
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
