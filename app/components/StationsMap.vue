<template>
    <GridLayout rows="auto" columns="*" id="mapbox-wrapper">
        <Mapbox
            row="0"
            :accessToken="token"
            mapStyle="mapbox://styles/mapbox/outdoors-v11"
            :height="height"
            zoomLevel="0"
            hideCompass="false"
            showUserLocation="false"
            disableZoom="false"
            disableRotation="false"
            disableScroll="false"
            disableTilt="false"
            class="m-b-10"
            @mapReady="onMapReady"
            v-if="!unavailable"
        />
        <StackLayout
            row="0"
            height="35"
            verticalAlignment="bottom"
            horizontalAlignment="right"
            class="toggle-container"
            v-if="hasMap && !isIOS"
        >
            <Image width="35" src="~/images/Icon_Expand_Map.png" @tap="toggleModal" />
        </StackLayout>

        <StackLayout row="0" v-if="loading" class="loading">
            <Label text="Loading Map" textWrap="true" horizontalAlignment="center" verticalAlignment="middle" />
        </StackLayout>
        <StackLayout row="0" v-if="unavailable" class="unavailable">
            <Label text="Map Not Available" textWrap="true" horizontalAlignment="center" verticalAlignment="middle" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import Vue from "vue";
import Promise from "bluebird";
import routes from "@/routes";
import Config from "@/config";
import { isIOS } from "@nativescript/core";
import { AvailableStation } from "@/store/types";

export default Vue.extend({
    name: "StationsMap",
    components: {},
    props: {
        id: {
            type: String,
            required: true,
        },
        height: {
            type: Number,
            default: 170,
        },
        mappedStations: {
            type: Object,
        },
        allowModal: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            isIOS: isIOS,
            loading: true,
            unavailable: false,
            shown: false,
            token: Config.mapbox.token,
            hasMap: false,
        };
    },
    watch: {
        mappedStations(this: any) {
            this.showStations();
        },
    },
    mounted(this: any) {
        console.log("StationsMap::mounted");
        return Promise.delay(10000).then(() => {
            if (!this.map) {
                this.unavailable = true;
            }
        });
    },
    methods: {
        onMapReady(this: any, ev) {
            this.map = ev.map;
            this.showStations();
        },
        toggleModal(this: any) {
            console.log("toggle-modal");
            this.$emit("toggle-modal");
        },
        showStations(this: any) {
            if (!this.mappedStations) {
                console.log("refresh map, no mappedStations");
                return;
            }

            if (!this.map) {
                console.log("refresh map, no map");
                return;
            }

            if (!this.shown) {
                console.log("refresh map");

                const markers = this.mappedStations.stations.map((station: any) => {
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

                const center = this.mappedStations.center;

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
            }

            this.loading = false;
            this.hasMap = true;
            this.shown = true;
        },
        onMarkerTap(this: any, station) {
            /*
            this.map.setCenter({
                lat: station.location.latitude,
                lng: station.location.longitude,
                animated: false,
            });
            this.map.setZoomLevel({
                level: 14,
                animated: false,
            });
			*/
        },
        onCalloutTap(this: any, station) {
            this.$emit("opened-details", station);
            return this.$navigateTo(routes.station.detail, {
                props: {
                    stationId: station.id,
                },
            });
        },
        getDeployStatus(this: any, station: AvailableStation) {
            return station.deployStartTime ? _L("deployed", station.deployStartTime) : _L("readyToDeploy");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.loading {
    margin-top: 40;
    font-size: 20;
    font-weight: bold;
    color: #ffffff;
}

.unavailable {
    padding-top: 40;
    font-size: 20;
    font-weight: bold;
    height: 170;
    background-color: #ececec;
}
</style>
