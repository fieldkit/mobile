<template>
    <StackLayout backgroundColor="white">
        <GridLayout rows="auto" columns="*,45">
            <Mapbox
                row="0"
                colSpan="2"
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
            <GridLayout row="0" col="1" height="35" verticalAlignment="bottom" :class="ios ? 'ios-container' : 'toggle-container'">
                <Image width="35" src="~/images/Icon_Collapse_Map.png" @tap="$modal.close()"></Image>
            </GridLayout>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";
import { screen } from "tns-core-modules/platform/platform";
import { isIOS } from "tns-core-modules/platform";
import routes from "../routes";
import { MAPBOX_ACCESS_TOKEN } from "../secrets";

export default Vue.extend({
    data() {
        return {
            ios: isIOS,
            mapboxToken: MAPBOX_ACCESS_TOKEN,
            mapHeight: screen.mainScreen.heightDIPs - 20,
        };
    },
    props: {},
    computed: {
        ...mapGetters({ stations: "availableStations", mapCenter: "mapCenter", hasCenter: "hasCenter" }),
    },
    watch: {
        hasCenter(newValue, oldValue) {
            console.log("hasCenter", newValue, oldValue);
            this.showStations();
        },
    },
    methods: {
        onMapReady(this: any, args) {
            this.map = args.map;
            this.showStations();
        },
        showStations(this: any) {
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

            const markers = Object.values(state.stations).map((mappedStation: any) => {
                return {
                    id: mappedStation.deviceId,
                    lat: mappedStation.location.latitude,
                    lng: mappedStation.location.longitude,
                    title: mappedStation.name,
                    subtitle: this.getDeployStatus(mappedStation),
                    iconPath: mappedStation.connected ? "images/Icon_Map_Dot.png" : "images/Icon_Map_Dot_unconnected.png",
                    onTap: () => this.onMarkerTap(mappedStation),
                    onCalloutTap: () => this.onCalloutTap(mappedStation),
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
        getDeployStatus(this: any, station /*: AvailableStation*/) {
            if (!station.deployStartTime) {
                return _L("readyToDeploy");
            }
            const start = station.deployStartTime;
            const month = start.getMonth() + 1;
            const day = start.getDate();
            const year = start.getFullYear();
            return _L("deployed") + ": " + month + "/" + day + "/" + year; // TODO i18n interpolate
        },
        onMarkerTap(this: any, station) {
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
        onCalloutTap(this: any, station) {
            console.log("STATION", station);
            return this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: station.id,
                },
            }).then(() => this.$modal.close());
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.ios-container {
    margin-bottom: 60;
    margin-right: 10;
}
.toggle-container {
    margin-bottom: 25;
    margin-right: 10;
}
</style>
