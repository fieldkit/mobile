<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,55">
            <ScrollView row="0">
                <StackLayout id="stations-list" class="m-y-10">
                    <ScreenHeader
                        title="FieldKit Stations"
                        :canNavigateBack="false"
                        :canNavigateSettings="false"
                        :bottomMargin="false"
                    />
                    <Label
                        v-if="stations.length == 0"
                        :text="_L('lookingForStations')"
                        class="m-10 p-10 text-center size-20"
                    />

                    <GridLayout row="auto" columns="*" id="mapbox-wrapper">
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
                            <Image
                                width="35"
                                src="~/images/Icon_Expand_Map.png"
                                dataState="collapsed"
                                @tap="toggleMap"
                            ></Image>
                        </StackLayout>
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
                        <Label
                            row="0"
                            col="0"
                            :text="s.name"
                            :class="
                                'station-name ' +
                                    (s.connected ? '' : 'disconnected')
                            "
                        />
                        <Label
                            row="1"
                            col="0"
                            :text="s.deployStatus"
                            :class="
                                'm-t-5 ' + (s.connected ? '' : 'disconnected')
                            "
                        />
                        <Image
                            col="1"
                            rowSpan="2"
                            width="20"
                            v-if="s.connected"
                            src="~/images/Icon_Connected.png"
                        ></Image>
                        <Image
                            col="1"
                            rowSpan="2"
                            width="20"
                            v-if="!s.connected"
                            src="~/images/Icon_not_Connected.png"
                        ></Image>
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
import {
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";
import { request } from "tns-core-modules/http";

import ScreenHeader from "./ScreenHeader";
import ScreenFooter from "./ScreenFooter";
import { MAPBOX_ACCESS_TOKEN } from "../secrets";

export default {
    data() {
        return {
            stations: [],
            mapHeight: 170,
            showToggle: false,
            mapboxToken: MAPBOX_ACCESS_TOKEN
        };
    },
    components: {
        ScreenHeader,
        ScreenFooter
    },
    props: {
        station: Object
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            this.stations = this.$stationMonitor.getStations();

            this.$stationMonitor.on(
                Observable.propertyChangeEvent,
                this.updateStations
            );
        },

        onMapReady(args) {
            this.map = args.map;
            this.showToggle = true;
            if (this.stations && this.stations.length > 0) {
                this.showStations();
            }
        },

        goBack(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);
            this.$navigateTo(routes.home);
        },

        getDeployStatus(station) {
            if (station.status != "recording") {
                return _L("readyToDeploy");
            }
            // try using hardware's startedTime first
            try {
                if (!station.statusReply.status.recording.startedTime) {
                    throw new Error("no startedTime")
                }
                // multiply by 1000 so the arg is in ms, not s
                const start = new Date(
                    station.statusReply.status.recording.startedTime * 1000
                );
                let month = start.getMonth() + 1;
                let day = start.getDate();
                let year = start.getFullYear();
                return _L("deployed") + ": " + month + "/" + day + "/" + year;
            } catch (error) {
                // console.log("error using hardware startedTime", error)
            }
            // try using db's start time
            try {
                let month = station.deployStartTime.getMonth() + 1;
                let day = station.deployStartTime.getDate();
                let year = station.deployStartTime.getFullYear();
                return _L("deployed") + ": " + month + "/" + day + "/" + year;
            } catch (error) {
                return _L("deployed");
            }
        },

        updateStations(data) {
            switch (data.propertyName.toString()) {
                case this.$stationMonitor.StationsUpdatedProperty: {
                    this.stations = data.value;
                    if (this.stations && this.stations.length > 0) {
                        this.showStations();
                    }
                    break;
                }
                case this.$stationMonitor.StationRefreshedProperty: {
                    break;
                }
            }
        },

        showStations() {
            this.stations.forEach(s => {
                const deployStatus = this.getDeployStatus(s);
                this.$set(s, "deployStatus", deployStatus);
            });

            let longMax = -180;
            let longMin = 180;
            let latMin = 90;
            let latMax = -90;
            let stationMarkers = [];
            let mappable = this.stations.filter(s => {
                return (
                    s.latitude &&
                    Number(s.latitude) != 1000 &&
                    s.longitude &&
                    Number(s.longitude) != 1000
                );
            });
            mappable.forEach(s => {
                s.latitude = Number(s.latitude);
                s.longitude = Number(s.longitude);
                if (mappable.length == 1 && this.map) {
                    this.map.setCenter({
                        lat: s.latitude,
                        lng: s.longitude
                    });
                    this.map.setZoomLevel({
                        level: 14
                    });
                } else {
                    if (s.latitude > latMax) {
                        latMax = s.latitude;
                    }
                    if (s.latitude < latMin) {
                        latMin = s.latitude;
                    }
                    if (s.longitude > longMax) {
                        longMax = s.longitude;
                    }
                    if (s.longitude < longMin) {
                        longMin = s.longitude;
                    }
                }
                stationMarkers.push({
                    id: "marker-" + s.id,
                    lat: s.latitude,
                    lng: s.longitude,
                    title: s.name,
                    subtitle: s.locationName,
                    iconPath: "images/Icon_Map_Dot.png",
                    selected: true,  // only one can be selected, tho
                    onCalloutTap: this.onMapMarkerTap
                });
            });

            if (this.map) {
                // remove first to keep them from stacking up
                this.map.removeMarkers();
                this.map.addMarkers(stationMarkers);
            }

            // prevent error caused by setting viewport with identical min max
            if (latMax == latMin && longMax == longMin && this.map) {
                this.map.setCenter({
                    lat: latMax,
                    lng: longMax
                });
                this.map.setZoomLevel({
                    level: 14
                });
            } else if (mappable.length > 1 && this.map) {
                const smallLatMargin = (latMax - latMin) / 10;
                // const smallLongMargin = (longMax - longMin) / 10;
                this.map.setViewport({
                    bounds: {
                        // zoom north out a little to fit marker
                        north: latMax + smallLatMargin,
                        east: longMax,
                        south: latMin,
                        west: longMin
                    }
                });
            }
        },

        onMapMarkerTap(marker) {
            // remove the "marker-" prefix
            let id = marker.id.split("marker-")[1];
            let stationObj = null;
            if (this.station && this.station.id == id) {
                stationObj = this.station;
            }

            this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: id,
                    station: stationObj
                }
            });
        },

        toggleMap(event) {
            const state = event.object.dataState;
            if (state == "collapsed") {
                event.object.dataState = "expanded";
                event.object.src = "~/images/Icon_Collapse_Map.png";
                // Footer is 55
                this.mapHeight = screen.mainScreen.heightDIPs - 55;
            } else {
                event.object.dataState = "collapsed";
                event.object.src = "~/images/Icon_Expand_Map.png";
                this.mapHeight = 170;
            }
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
            let stationObj = null;
            if (this.station && this.station.id == id) {
                stationObj = this.station;
            }

            this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: id,
                    station: stationObj
                }
            });
        },

        showDev() {
            dialogs
                .confirm({
                    title: "Do you want to view developer options?",
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel")
                })
                .then(result => {
                    if (result) {
                        this.$navigateTo(routes.home);
                    }
                });
        }
    }
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

.dev-link {
    color: $fk-gray-lightest;
    padding: 10;
}
</style>
