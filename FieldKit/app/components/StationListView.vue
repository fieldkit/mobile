<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,80">
            <ScrollView row="0">
                <StackLayout id="stations-list" class="m-y-10">
                    <ScreenHeader
                        title="FieldKit Stations"
                        :canNavigateBack="false"
                        :canNavigateSettings="false"
                    />
                    <Label
                        v-if="stations.length == 0"
                        :text="_L('lookingForStations')"
                        class="m-10 p-10 text-center size-20"
                    />

                    <Mapbox
                        :accessToken="mapboxToken"
                        automationText="currentLocationMap"
                        mapStyle="mapbox://styles/mapbox/outdoors-v11"
                        height="150"
                        zoomLevel="0"
                        hideCompass="false"
                        showUserLocation="false"
                        disableZoom="false"
                        disableRotation="false"
                        disableScroll="false"
                        disableTilt="false"
                        class="m-b-10"
                        @mapReady="onMapReady"
                        v-if="connectedToInternet"
                    ></Mapbox>

                    <GridLayout
                        v-for="s in stations"
                        :key="s.sortedIndex"
                        :id="'station-' + s.id"
                        rows="*,*"
                        columns="85*,15*"
                        class="station-container m-y-5 m-x-15 p-10"
                        orientation="vertical"
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
                            :text="getDeployStatus(s)"
                            class="m-t-5"
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
            connectedToInternet: false,
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

            // This is a sad hack...
            // TODO: something more sensible
            // (the NS connectivity module
            // does not help in the case of
            // self AP connections)
            request({
                url: "https://google.com",
                method: "GET"
            }).then((response) => {
                this.connectedToInternet = true;
            }, (e) => {
            });

            this.stations = this.$stationMonitor.getStations();

            this.$stationMonitor.on(
                Observable.propertyChangeEvent,
                this.updateStations
            );
        },

        onMapReady(args) {
            this.map = args.map;
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
                return "Ready to deploy";
            }
            // try using hardware's startedTime first
            try {
                // multiply by 1000 so the arg is in ms, not s
                const start = new Date(
                    station.statusReply.status.recording.startedTime * 1000
                );
                let month = start.getMonth() + 1;
                let day = start.getDate();
                let year = start.getFullYear();
                return "Deployed: " + month + "/" + day + "/" + year;
            } catch (error) {
                // console.log("error using hardware startedTime", error)
            }
            // try using db's start time
            try {
                let month = station.deployStartTime.getMonth() + 1;
                let day = station.deployStartTime.getDate();
                let year = station.deployStartTime.getFullYear();
                return "Deployed: " + month + "/" + day + "/" + year;
            } catch (error) {
                return "Deployed";
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
                    lat: s.latitude,
                    lng: s.longitude,
                    title: s.name,
                    subtitle: s.locationName,
                    iconPath: "images/map_dot.png"
                });
            });

            if (this.map) {
                this.map.addMarkers(stationMarkers);
            }

            if (mappable.length > 1 && this.map) {
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

.station-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.station-name {
    font-size: 18;
    color: $fk-primary-black;
}
.station-name.disconnected {
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
