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
            <GridLayout
                row="0"
                col="1"
                height="35"
                verticalAlignment="bottom"
                :class="ios ? 'ios-container' : 'toggle-container'"
            >
                <Image
                    width="35"
                    src="~/images/Icon_Collapse_Map.png"
                    @tap="$modal.close()"
                ></Image>
            </GridLayout>
        </GridLayout>
    </StackLayout>
</template>

<script>
import { isIOS } from "tns-core-modules/platform";
import routes from "../routes";
import { MAPBOX_ACCESS_TOKEN } from "../secrets";

export default {
    data() {
        return {
            ios: isIOS,
            mapboxToken: MAPBOX_ACCESS_TOKEN
        };
    },
    props: ["bounds", "stationMarkers", "mapHeight"],
    methods: {
        onMapReady(args) {
            this.map = args.map;
            // re-define event listener
            this.stationMarkers.forEach(s => {
                s.onCalloutTap = this.onMapMarkerTap
            });

            if (this.stationMarkers.length == 1 && this.map) {
                this.map.setZoomLevel({
                    level: 14,
                    animated: false
                });
                this.map.setCenter({
                    lat: this.stationMarkers[0].lat,
                    lng: this.stationMarkers[0].lng,
                    animated: false
                });
            } else if (
                this.bounds.latMax == this.bounds.latMin
                && this.bounds.longMax == this.bounds.longMin
                && this.map
            ) {
                // prevent error when setting viewport with identical min max
                this.map.setZoomLevel({
                    level: 14,
                    animated: false
                });
                this.map.setCenter({
                    lat: this.bounds.latMax,
                    lng: this.bounds.longMax,
                    animated: false
                });
            } else if (this.stationMarkers.length > 1 && this.map) {
                const smallLatMargin =
                    (this.bounds.latMax - this.bounds.latMin) / 10;
                // const smallLongMargin = (longMax - longMin) / 10;
                this.map.setViewport({
                    bounds: {
                        // zoom north out a little to fit marker
                        north: this.bounds.latMax + smallLatMargin,
                        east: this.bounds.longMax,
                        south: this.bounds.latMin,
                        west: this.bounds.longMin
                    }
                });
            }

            if (this.map) {
                // remove first to keep them from stacking up
                this.map.removeMarkers();
                this.map.addMarkers(this.stationMarkers);
            }
        },

        onMapMarkerTap(marker) {
            // TODO: show spinner?

            // remove the "marker-" prefix
            let id = marker.id.split("marker-")[1];
            this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: id
                }
            });
            setTimeout(() => {
                this.$modal.close();
            }, 100);
        },
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.ios-container {
    margin-bottom: 60;
    margin-right: 10;
}
.toggle-container {
    margin-bottom: 25;
    margin-right: 10;
}

</style>