<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,55">
            <ScrollView row="0">
                <StackLayout id="stations-list" class="m-y-10">
                    <ScreenHeader title="FieldKit Stations" :canNavigateBack="false" :canNavigateSettings="false" :bottomMargin="false" />

                    <GridLayout rows="auto" columns="*" id="mapbox-wrapper">
                        <Mapbox
                            row="0"
                            :accessToken="mapboxToken"
                            automationText="currentLocationMap"
                            mapStyle="mapbox://styles/mapbox/outdoors-v11"
                            height="170"
                            zoomLevel="0"
                            hideCompass="false"
                            showUserLocation="false"
                            disableZoom="false"
                            disableRotation="false"
                            disableScroll="false"
                            disableTilt="false"
                            class="m-b-10"
                            @mapReady="onMapReady"
                        ></Mapbox>
                        <StackLayout
                            row="0"
                            height="35"
                            verticalAlignment="bottom"
                            horizontalAlignment="right"
                            class="toggle-container"
                            v-if="map != null"
                        >
                            <Image width="35" src="~/images/Icon_Expand_Map.png" @tap="openModal"></Image>
                        </StackLayout>
                    </GridLayout>

                    <GridLayout rows="*,*,*" v-if="stations.length == 0" class="m-t-20">
                        <Label row="0" text="Connect a Station" class="m-x-10 m-t-30 m-b-10 text-center bold dark size-20" />
                        <Label
                            row="1"
                            text="You have no stations. Add a station to start collecting data."
                            class="text-center size-18 instruction"
                            textWrap="true"
                        />
                        <Button row="2" class="btn btn-primary btn-padded m-y-20" text="Add a Station" @tap="goToAddStation"></Button>
                    </GridLayout>

                    <GridLayout
                        v-for="(s, index) in stations"
                        :key="s.sortedIndex"
                        :id="'station-' + s.id"
                        rows="*,*"
                        columns="85*,15*"
                        class="station-container m-y-5 m-x-15 p-10"
                        orientation="vertical"
                        :automationText="'linkToStation' + index"
                        @tap="goToDetail($event, s)"
                    >
                        <Label row="0" col="0" :text="s.name" :class="'station-name ' + (s.connected ? '' : 'disconnected')" />
                        <Label row="1" col="0" :text="getDeployStatus(s)" :class="'m-t-5 ' + (s.connected ? '' : 'disconnected')" />
                        <Image col="1" rowSpan="2" width="20" v-if="s.connected" src="~/images/Icon_Connected.png"></Image>
                        <Image col="1" rowSpan="2" width="20" v-if="!s.connected" src="~/images/Icon_not_Connected.png"></Image>
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

<script>
import { mapState, mapGetters } from "vuex";
import { screen } from "tns-core-modules/platform/platform";
import * as dialogs from "tns-core-modules/ui/dialogs";
import ScreenHeader from "./ScreenHeader";
import ScreenFooter from "./ScreenFooter";
import { MAPBOX_ACCESS_TOKEN } from "../secrets";
import MapModal from "./MapModal";
import routes from "../routes";

export default {
    computed: {
        ...mapGetters({ stations: "availableStations", mapCenter: "mapCenter", hasCenter: "hasCenter" }),
    },
    watch: {
        hasCenter(newValue, oldValue) {
            console.log("hasCenter", newValue, oldValue);
            this.showStations();
        },
    },
    data() {
        return {
            map: null,
            mapboxToken: MAPBOX_ACCESS_TOKEN,
        };
    },
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    methods: {
        onPageLoaded() {},
        onMapReady(ev) {
            this.map = ev.map;
            this.showStations();
        },
        openModal(event) {
            /*
            const options = {
                props: {
                    bounds: this.bounds,
                    mapHeight: screen.mainScreen.heightDIPs - 20,
                },
                fullscreen: true,
            };
            return this.$showModal(MapModal, options);
			*/
        },
        goToAddStation() {
            return this.$navigateTo(routes.connectStation);
        },
        getDeployStatus(station /*: AvailableStation*/) {
            if (!station.deployStartTime) {
                return _L("readyToDeploy");
            }
            const start = station.deployStartTime;
            const month = start.getMonth() + 1;
            const day = start.getDate();
            const year = start.getFullYear();
            return _L("deployed") + ": " + month + "/" + day + "/" + year; // TODO i18n interpolate
        },
        showStations() {
            if (!this.map) {
                console.log("refresh map, no map");
                return;
            }

            const state = this.$store.state.map;
            const center = this.$store.getters.mapCenter;
            if (!center) {
                console.log("refresh map, no center");
                return;
            }

            console.log("refresh map");

            const markers = Object.values(state.stations).map(station => {
                return {
                    id: station.deviceId,
                    lat: station.location.latitude,
                    lng: station.location.longitude,
                    title: station.name,
                    subtitle: this.getDeployStatus(station),
                    iconPath: station.connected ? "images/Icon_Map_Dot.png" : "images/Icon_Map_Dot_unconnected.png",
                    onTap: () => this.onMarkerTap(station),
                    onCalloutTap: () => this.onCalloutTap(station),
                };
            });

            this.map.removeMarkers();
            this.map.addMarkers(markers);

            this.map.setZoomLevel({
                level: center.zoom,
                animated: false,
            });

            this.map.setCenter({
                lat: center.location.latitude,
                lng: center.location.longitude,
                animated: false,
            });

            const min = center.bounds.min;
            const max = center.bounds.max;
            this.map.setViewport({
                bounds: {
                    north: max.latitude,
                    east: max.longitude,
                    south: min.latitude,
                    west: min.longitude,
                },
                animated: false,
            });
        },
        onMarkerTap(station) {
            this.map.setCenter({
                lat: station.location.latitude,
                lng: station.location.longitude,
                animated: false,
            });
            this.map.setZoomLevel({
                level: 14,
                animated: false,
            });
        },
        onCalloutTap(station) {
            return this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: station.id,
                },
            });
        },
        goToDetail(ev, station) {
            // Change background color when pressed
            /*
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);
			*/

            return this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: station.id,
                },
            });
        },
        showDev() {
            return dialogs
                .confirm({
                    title: "Do you want to view development options?",
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel"),
                })
                .then(yes => {
                    if (yes) {
                        return this.$navigateTo(routes.developerMenu);
                    }
                });
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
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
