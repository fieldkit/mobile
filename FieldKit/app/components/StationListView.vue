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
                            :height="mapHeight"
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
                            v-if="showToggle"
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
                        @tap="goToDetail"
                    >
                        <Label row="0" col="0" :text="s.name" :class="'station-name ' + (s.connected ? '' : 'disconnected')" />
                        <Label row="1" col="0" :text="s.deployStatus" :class="'m-t-5 ' + (s.connected ? '' : 'disconnected')" />
                        <Image col="1" rowSpan="2" width="20" v-if="s.connected" src="~/images/Icon_Connected.png"></Image>
                        <Image col="1" rowSpan="2" width="20" v-if="!s.connected" src="~/images/Icon_not_Connected.png"></Image>
                    </GridLayout>
                </StackLayout>
            </ScrollView>
            <StackLayout horizontalAlignment="right" verticalAlignment="bottom">
                <Label text="dev" class="dev-link" @doubleTap="showDev" />
            </StackLayout>
            <!-- footer -->
            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import { screen } from "tns-core-modules/platform/platform";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { BetterObservable } from "../services/rx";
import { request } from "tns-core-modules/http";

import MapModal from "./MapModal";
import ScreenHeader from "./ScreenHeader";
import ScreenFooter from "./ScreenFooter";
import { MAPBOX_ACCESS_TOKEN } from "../secrets";

export default {
    data() {
        return {
            bounds: {},
            stations: [],
            mapHeight: 170,
            showToggle: false,
            stationMarkers: [],
            fullScreenMap: false,
            mapboxToken: MAPBOX_ACCESS_TOKEN,
        };
    },
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    props: {
        station: Object,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            this.updateStations = this.updateStations.bind(this);
            this.$stationMonitor.subscribeAll(this.updateStations);
        },

        onMapReady(args) {
            this.map = args.map;
            this.showToggle = true;
            if (this.stations && this.stations.length > 0) {
                this.showStations();
            }
        },

        openModal(event) {
            const options = {
                props: {
                    bounds: this.bounds,
                    stationMarkers: this.stationMarkers,
                    mapHeight: screen.mainScreen.heightDIPs - 20,
                },
                fullscreen: true,
            };
            this.$showModal(MapModal, options);
        },

        goToAddStation() {
            this.unsubscribe();
            this.$navigateTo(routes.connectStation);
        },

        getDeployStatus(station) {
            if (station.status != "recording") {
                return _L("readyToDeploy");
            }
            // try using hardware's startedTime first
            try {
                if (!station.statusJson.status.recording.startedTime) {
                    throw new Error("no startedTime");
                }
                // multiply by 1000 so the arg is in ms, not s
                const start = new Date(station.statusJson.status.recording.startedTime * 1000);
                let month = start.getMonth() + 1;
                let day = start.getDate();
                let year = start.getFullYear();
                return _L("deployed") + ": " + month + "/" + day + "/" + year;
            } catch (error) {
                // console.log("error using hardware startedTime", error)
            }
            // try using db's start time
            try {
                const dbDate = new Date(station.deployStartTime);
                let month = dbDate.getMonth() + 1;
                let day = dbDate.getDate();
                let year = dbDate.getFullYear();
                if (isNaN(month)) {
                    throw new Error("no deployStartTime");
                }
                return _L("deployed") + ": " + month + "/" + day + "/" + year;
            } catch (error) {
                return _L("deployed");
            }
        },

        updateStations(stations) {
            this.stations = stations;
            if (this.stations && this.stations.length > 0) {
                this.showStations();
            }
        },

        showStations() {
            this.stations.forEach(s => {
                const deployStatus = this.getDeployStatus(s);
                this.$set(s, "deployStatus", deployStatus);
            });

            this.bounds.longMax = -180;
            this.bounds.longMin = 180;
            this.bounds.latMin = 90;
            this.bounds.latMax = -90;
            this.stationMarkers = [];
            let mappable = this.stations.filter(s => {
                return s.latitude && Number(s.latitude) != 1000 && s.longitude && Number(s.longitude) != 1000;
            });
            mappable.forEach((s, i) => {
                s.latitude = Number(s.latitude);
                s.longitude = Number(s.longitude);
                if (mappable.length == 1 && this.map) {
                    this.map.setZoomLevel({
                        level: 14,
                        animated: false,
                    });
                    this.map.setCenter({
                        lat: s.latitude,
                        lng: s.longitude,
                        animated: false,
                    });
                } else {
                    if (s.latitude > this.bounds.latMax) {
                        this.bounds.latMax = s.latitude;
                    }
                    if (s.latitude < this.bounds.latMin) {
                        this.bounds.latMin = s.latitude;
                    }
                    if (s.longitude > this.bounds.longMax) {
                        this.bounds.longMax = s.longitude;
                    }
                    if (s.longitude < this.bounds.longMin) {
                        this.bounds.longMin = s.longitude;
                    }
                }
                this.stationMarkers.push({
                    id: "marker-" + s.id,
                    lat: s.latitude,
                    lng: s.longitude,
                    title: s.name,
                    subtitle: s.deployStatus,
                    iconPath: s.connected ? "images/Icon_Map_Dot.png" : "images/Icon_Map_Dot_unconnected.png",
                    onTap: this.onMarkerTap,
                    onCalloutTap: this.onCalloutTap,
                });
            });

            if (this.map) {
                // remove first to keep them from stacking up
                this.map.removeMarkers();
                this.map.addMarkers(this.stationMarkers);
            }

            // prevent error when setting viewport with identical min max
            // and prevent zooming in too close when stations are in same place
            if (
                mappable.length > 1 &&
                this.bounds.latMax - this.bounds.latMin < 0.0001 &&
                this.bounds.longMax - this.bounds.longMin < 0.0001 &&
                this.map
            ) {
                this.map.setZoomLevel({
                    level: 14,
                    animated: false,
                });
                this.map.setCenter({
                    lat: this.bounds.latMax,
                    lng: this.bounds.longMax,
                    animated: false,
                });
            } else if (mappable.length > 1 && this.map) {
                const smallLatMargin = (this.bounds.latMax - this.bounds.latMin) / 10;
                // const smallLongMargin =
                //     (this.bounds.longMax - this.bounds.longMin) / 10;
                this.map.setViewport({
                    bounds: {
                        // zoom north out a little to fit marker
                        north: this.bounds.latMax + smallLatMargin,
                        east: this.bounds.longMax,
                        south: this.bounds.latMin,
                        west: this.bounds.longMin,
                    },
                    // animated: false // causes map crash
                });
            }
        },

        onMarkerTap(marker) {
            this.map.setZoomLevel({
                level: 14,
                animated: false,
            });
            this.map.setCenter({
                lat: marker.lat,
                lng: marker.lng,
                animated: false,
            });
        },

        onCalloutTap(marker) {
            // remove the "marker-" prefix
            let id = marker.id.split("marker-")[1];
            this.unsubscribe();
            this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: id,
                },
            });
        },

        goToDetail(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            // remove the "station-" prefix
            let id = event.object.id.split("station-")[1];
            this.unsubscribe();
            this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: id,
                },
            });
        },

        showDev() {
            dialogs
                .confirm({
                    title: "Do you want to view development options?",
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel"),
                })
                .then(result => {
                    if (result) {
                        this.unsubscribe();
                        this.$navigateTo(routes.developerMenu);
                    }
                });
        },

        unsubscribe() {
            this.$stationMonitor.unsubscribeAll(this.updateStations);
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
