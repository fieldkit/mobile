<template>
    <StackLayout @loaded="onLoaded" @unloaded="onUnloaded">
        <!-- So weird. So on iOS the map likes to extend above the scrollable area and this prevents that. -->
        <StackLayout class="m-t-5" v-if="isIOS"></StackLayout>

        <GridLayout rows="auto" id="mapbox-wrapper">
            <ContentView row="0" :height="height">
                <Mapbox
                    :accessToken="token"
                    zoomLevel="11"
                    hideCompass="false"
                    showUserLocation="true"
                    disableZoom="false"
                    disableRotation="false"
                    disableScroll="false"
                    disableTilt="false"
                    mapStyle="mapbox://styles/mapbox/outdoors-v11"
                    @mapReady="onMapReady"
                    @moveBeginEvent="onMapMove"
                    @locationPermissionGranted="onLocationPermissionGranted"
                    @locationPermissionDenied="onLocationPermissionDenied"
                />
            </ContentView>

            <StackLayout row="0" height="35" verticalAlignment="bottom" horizontalAlignment="right" class="toggle-container" v-if="!isIOS">
                <Image width="35" src="~/images/Icon_Expand_Map.png" @tap="toggleModal" />
            </StackLayout>

            <StackLayout row="0" v-if="loading" class="loading m-t-20">
                <Label text="Loading Map" textWrap="true" horizontalAlignment="center" verticalAlignment="middle" />
            </StackLayout>

            <StackLayout row="0" v-if="unavailable" class="unavailable">
                <Label text="Map Not Available" textWrap="true" horizontalAlignment="center" verticalAlignment="middle" />
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import Config from "@/config";
import { routes } from "@/routes";
import { isIOS } from "@nativescript/core";
import { AvailableStation } from "@/store/types";
import { debug, _L, uuidv4 } from "@/lib";

export default Vue.extend({
    name: "StationsMap",
    props: {
        height: {
            type: Number,
            default: (): number => {
                if (isIOS) {
                    return 270;
                }
                return 170;
            },
        },
        mappedStations: {
            type: Object,
            required: true,
        },
        mapKey: {
            type: Number,
            default: 0,
        },
    },
    data(): {
        key: string;
        isIOS: boolean;
        loading: boolean;
        unavailable: boolean;
        shown: false;
        token: string;
        hasMap: boolean;
        located: boolean;
    } {
        return {
            key: uuidv4(),
            isIOS: isIOS,
            loading: true,
            unavailable: false,
            shown: false,
            token: Config.mapbox.token,
            hasMap: false,
            located: true,
        };
    },
    watch: {
        mappedStations(): void {
            this.shown = false;
            this.showStations();
        },
    },
    updated(): void {
        debug.log(this.key, "map: updated", this.isIOS);
        this.showStations();
    },
    mounted(this: any): void {
        debug.log(this.key, "map: mounted");
    },
    beforeDestroy(): void {
        debug.log(this.key, "map: before-destroy");
    },
    destroyed(): void {
        debug.log(this.key, "map: destroyed");
    },
    methods: {
        onLoaded(): void {
            debug.log(this.key, "map: loaded");
        },
        onUnloaded(): void {
            debug.log(this.key, "map: unloaded");
        },
        onMapReady(this: any, ev): void {
            debug.log(this.key, "map: map-ready");
            this.map = ev.map;
            this.showStations();
        },
        toggleModal(this: any): void {
            debug.log(this.key, "map: toggle-modal");
            this.$emit("toggle-modal");
        },
        showStations(this: any): void {
            if (!this.mappedStations) {
                debug.log(this.key, "map: refresh, no mappedStations");
                return;
            }

            if (!this.map) {
                debug.log(this.key, "map: refresh, no map");
                return;
            }

            if (!this.shown) {
                debug.log(this.key, "map: refreshing");

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

                if (!this.located) {
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

                    this.located = true;
                }
            } else {
                debug.log(this.key, "map: skip-refresh");
            }

            this.loading = false;
            this.hasMap = true;
            this.shown = true;
        },
        onMarkerTap(this: any, station): void {
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
        async onCalloutTap(this: any, station): Promise<void> {
            this.$emit("opened-details", station);
            await this.$deprecatedNavigateTo(routes.station.detail, {
                props: {
                    stationId: station.id,
                },
            });
        },
        onMapMove(this: any): void {
            debug.log(this.key, "map: move");
        },
        onLocationPermissionGranted(this: any): void {
            debug.log(this.key, "map: onLocationPermissionGranted");
            this.map.getUserLocation().then((location) => {
                debug.log("map: user location: " + location.location.lat + ", " + location.location.lng);
                if (isIOS) {
                    this.map.setCenter({
                        lat: location.location.lat,
                        lng: location.location.lng,
                        animated: false,
                    });
                }
            });
        },
        onLocationPermissionDenied(): void {
            debug.log(this.key, "map: onLocationPermissionDenied");
        },
        getDeployStatus(this: any, station: AvailableStation): string {
            return station.deployStartTime ? _L("deployed", station.deployStartTime) : _L("readyToDeploy");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.mapbox-wrapper {
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
        background-color: #ececec;
    }
}
</style>
