<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout
                flexDirection="column"
                justifyContent="space-between"
                class="p-t-10"
            >
                <ScreenHeader
                    :title="viewTitle"
                    :subtitle="station.name"
                    :onBack="goBack"
                    :canNavigateSettings="false"
                />

                <StackLayout>
                    <GridLayout rows="auto" columns="33*,33*,34*" class="top-line-bkgd">
                        <StackLayout col="0" class="top-line"></StackLayout>
                    </GridLayout>
                    <StackLayout
                        class="text-center disconnect-warning"
                        v-if="!station.connected"
                    >
                        <Label text="Station Disconnected" />
                    </StackLayout>

                    <Mapbox
                        :accessToken="mapboxToken"
                        automationText="currentLocationMap"
                        mapStyle="mapbox://styles/mapbox/outdoors-v11"
                        height="150"
                        hideCompass="false"
                        zoomLevel="0"
                        showUserLocation="false"
                        disableZoom="false"
                        disableRotation="false"
                        disableScroll="false"
                        disableTilt="false"
                        @mapReady="onMapReady"
                    ></Mapbox>
                </StackLayout>

                <!-- Name your location -->
                <GridLayout rows="*" columns="*" class="m-t-30 m-b-20 m-x-10">
                    <StackLayout row="0">
                        <GridLayout rows="auto,auto" columns="*">
                            <Label
                                row="0"
                                :text="_L('nameYourLocation')"
                                class="size-12"
                                v-if="station.locationName"
                            />
                            <TextField
                                row="1"
                                class="input"
                                id="location-name-field"
                                :hint="_L('nameYourLocation')"
                                :isEnabled="true"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="station.locationName"
                                @focus="toggleLocationEdit"
                                @blur="checkLocationName"
                            ></TextField>
                        </GridLayout>
                        <Label
                            class="validation-error"
                            id="no-location"
                            horizontalAlignment="left"
                            :text="_L('locationRequired')"
                            textWrap="true"
                            :visibility="noLocation ? 'visible' : 'collapsed'"
                        ></Label>
                        <Label
                            class="validation-error"
                            id="location-too-long"
                            horizontalAlignment="left"
                            :text="_L('locationOver255')"
                            textWrap="true"
                            :visibility="
                                locationTooLong ? 'visible' : 'collapsed'
                            "
                        ></Label>
                        <Label
                            class="validation-error"
                            id="location-not-printable"
                            horizontalAlignment="left"
                            :text="_L('locationNotPrintable')"
                            textWrap="true"
                            :visibility="
                                locationNotPrintable ? 'visible' : 'collapsed'
                            "
                        ></Label>
                    </StackLayout>
                </GridLayout>
                <!-- end: Name your location -->

                <!-- Data capture interval -->
                <ConfigureCaptureInterval :station="station" />
                <!-- end: Data capture interval -->

                <Button
                    class="btn btn-primary m-y-20"
                    :text="_L('continue')"
                    automationText="nextButton"
                    @tap="goToNext"
                ></Button>

                <TextView id="hidden-field" />
            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { MAPBOX_ACCESS_TOKEN } from "../secrets";
import ScreenHeader from "./ScreenHeader";
import ConfigureCaptureInterval from "./ConfigureCaptureInterval";
import Services from "../services/services";
import routes from "../routes";

const dbInterface = Services.Database();

export default {
    data() {
        return {
            viewTitle: _L("deployment"),
            mapboxToken: MAPBOX_ACCESS_TOKEN,
            origLocationName: "",
            isEditingLocation: false,
            noLocation: false,
            locationNotPrintable: false,
            locationTooLong: false,
            origLatitude: "",
            origLongitude: "",
        };
    },
    props: ["station"],
    components: {
        ScreenHeader,
        ConfigureCaptureInterval
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;

            this.saveOriginalValues();
        },

        onMapReady(args) {
            this.map = args.map;
            this.enableAndGetLocation();
        },

        goBack(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.stationDetail, {
                props: {
                    station: this.station
                }
            });
        },

        goToNext(event) {
            this.saveLocationName();

            this.$navigateTo(routes.deployNotes, {
                props: {
                    station: this.station
                }
            });
        },

        saveOriginalValues() {
            if (!this.station.locationName) {
                this.station.locationName = "";
            }
            this.origLocationName = this.station.locationName;
            this.origLatitude = this.station.latitude;
            this.origLongitude = this.station.longitude;
        },

        enableAndGetLocation() {
            geolocation.isEnabled().then(isEnabled => {
                if (isEnabled) {
                    this.getLocation();
                } else {
                    geolocation.enableLocationRequest().then(
                        () => {
                            this.getLocation();
                        },
                        e => {
                            // console.log("enableLocationRequest() error: " + (e.message || e));
                        }
                    );
                }
            });
        },

        getLocation() {
            geolocation
                .getCurrentLocation({
                    desiredAccuracy: Accuracy.high,
                    updateDistance: 10,
                    maximumAge: 20000,
                    timeout: 20000
                })
                .then(
                    loc => {
                        if (loc) {
                            this.station.latitude = loc.latitude;
                            this.station.longitude = loc.longitude;

                            this.map.setCenter({
                                lat: this.station.latitude,
                                lng: this.station.longitude,
                                animated: false
                            });
                            this.map.setZoomLevel({
                                level: 18
                                // animated: true
                            });
                            this.mapMarker = {
                                lat: this.station.latitude,
                                lng: this.station.longitude,
                                title: this.station.locationName,
                                iconPath: 'images/Icon_Map_Dot.png'
                            };
                            this.map.addMarkers([this.mapMarker]);
                            this.saveLocationCoordinates();
                        } else {
                            // handle no location?
                        }
                    },
                    e => {
                        console.log("getlocation error: " + e.message);
                    }
                );
        },

        toggleLocationEdit() {
            this.isEditingLocation = true;
        },

        checkLocationName() {
            // not sure yet what location name validation we'll do
            return true;
            // this.noLocation = false;
            // this.noLocation = !this.station.locationName || this.station.locationName.length == 0;
            // return !this.noLocation;
        },

        saveLocationName() {
            this.removeFocus("location-name-field");
            this.isEditingLocation = false;

            let valid = this.checkLocationName();
            if (valid && this.origLocationName != this.station.locationName) {
                // send location name as field note to portal
                let portalParams = {
                    stationId: this.station.id,
                    created: new Date(),
                    category_id: 1,
                    note: this.station.locationName
                }
                this.$portalInterface.addFieldNote(portalParams);

                if (this.mapMarker) {
                    this.mapMarker.update({ title: this.station.locationName });
                }
                dbInterface.setStationLocationName(this.station);
                let configChange = {
                    stationId: this.station.id,
                    before: this.origLocationName,
                    after: this.station.locationName,
                    affectedField: "location",
                    author: this.userName
                };
                dbInterface.recordStationConfigChange(configChange);
                this.origLocationName = this.station.locationName;
            }
        },

        saveLocationCoordinates() {
            if (this.origLatitude != this.station.latitude) {
                dbInterface.setStationLocationCoordinates(this.station);
                // store latitude config change
                let configChange = {
                    stationId: this.station.id,
                    before: this.origLatitude,
                    after: this.station.latitude,
                    affectedField: "latitude",
                    author: this.userName
                };
                dbInterface.recordStationConfigChange(configChange);
                this.origLatitude = this.station.latitude;
                // store longitude config change
                configChange = {
                    stationId: this.station.id,
                    before: this.origLongitude,
                    after: this.station.longitude,
                    affectedField: "longitude",
                    author: this.userName
                };
                dbInterface.recordStationConfigChange(configChange);
                this.origLongitude = this.station.longitude;
            }
        },

        removeFocus(id) {
            let textField = this.page.getViewById(id);
            textField.dismissSoftInput();

            let hiddenField = this.page.getViewById("hidden-field");
            hiddenField.focus();
            hiddenField.dismissSoftInput();
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.top-line-bkgd {
    background-color: $fk-gray-lighter;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}
.disconnect-warning {
    background-color: rgb(255, 255, 175);
    padding-top: 5;
    padding-bottom: 5;
}

#location-name-field {
    padding-bottom: 5;
    width: 100%;
    font-size: 18;
    border-bottom-color: $fk-primary-black;
    border-bottom-width: 1;
}

.validation-error {
    width: 100%;
    font-size: 12;
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
}

#hidden-field {
    opacity: 0;
}
</style>
