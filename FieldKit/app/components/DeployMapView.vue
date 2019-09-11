<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between">
                <GridLayout rows="auto" columns="10*,90*">
                    <StackLayout col="0" class="round" verticalAlignment="top" @tap="goBack">
                        <Image width="21" src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <StackLayout col="1" class="title-container m-t-10 m-r-30">
                        <Label class="bold text-center" :text="viewTitle" textWrap="true"></Label>
                        <Label class="bold text-center" :text="station.name" textWrap="true"></Label>
                    </StackLayout>
                </GridLayout>

                <Mapbox
                    :accessToken="mapboxToken"
                    automationText="currentLocationMap"
                    mapStyle="satellite"
                    height="200"
                    hideCompass="false"
                    zoomLevel="0"
                    showUserLocation="false"
                    disableZoom="false"
                    disableRotation="false"
                    disableScroll="false"
                    disableTilt="false"
                    @mapReady="onMapReady">
                </Mapbox>

                <!-- Name your location -->
                <GridLayout rows="*" columns="*" class="m-t-20 m-x-10">
                    <StackLayout row="0">
                        <FlexboxLayout>
                            <TextField
                                class="input"
                                id="location-name-field"
                                :hint="_L('nameYourLocation')"
                                :isEnabled="true"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="station.location_name"
                                @focus="toggleLocationEdit"
                                @blur="checkLocationName"></TextField>
                            <Label
                                class="size-10 char-count"
                                :text="station.location_name.length"
                                v-show="isEditingLocation"></Label>
                        </FlexboxLayout>
                        <Label
                            class="validation-error"
                            id="no-location"
                            horizontalAlignment="left"
                            :text="_L('locationRequired')"
                            textWrap="true"
                            :visibility="noLocation ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="location-too-long"
                            horizontalAlignment="left"
                            :text="_L('locationOver255')"
                            textWrap="true"
                            :visibility="locationTooLong ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="location-not-printable"
                            horizontalAlignment="left"
                            :text="_L('locationNotPrintable')"
                            textWrap="true"
                            :visibility="locationNotPrintable ? 'visible' : 'collapsed'"></Label>
                    </StackLayout>
                </GridLayout>
                <!-- end: Name your location -->

                <!-- Data capture interval -->
                <GridLayout rows="auto,auto,auto,auto" columns="*,*" class="m-x-10 m-y-20">
                    <Label row="0" colSpan="2" class="size-20" :text="_L('dataCaptureSchedule')"></Label>
                    <Label row="1"
                        colSpan="2"
                        class="size-14 m-y-5"
                        textWrap="true"
                        :text="_L('dataCaptureNotice')"></Label>
                    <TextField row="2"
                        col="0"
                        class="input"
                        id="interval-field"
                        :isEnabled="true"
                        keyboardType="name"
                        autocorrect="false"
                        autocapitalizationType="none"
                        v-model="displayInterval"
                        @blur="checkInterval"></TextField>
                    <StackLayout row="2" col="1" id="drop-down-container">
                        <DropDown :items="timeUnits"
                            @selectedIndexChanged="onSelectedIndexChanged"
                            backgroundColor="#F4F5F7"
                            class="drop-down"
                            :selectedIndex="currentUnit" ></DropDown>
                    </StackLayout>
                    <StackLayout row="3" col="0">
                        <Label
                            class="validation-error"
                            id="no-interval"
                            horizontalAlignment="left"
                            :text="_L('intervalRequired')"
                            textWrap="true"
                            :visibility="noInterval ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="interval-not-numeric"
                            horizontalAlignment="left"
                            :text="_L('intervalNotNumber')"
                            textWrap="true"
                            :visibility="intervalNotNumber ? 'visible' : 'collapsed'"></Label>
                    </StackLayout>
                </GridLayout>
                <!-- end: Data capture interval -->

                <Button class="btn btn-primary m-b-10"
                    text="Continue"
                    automationText="nextButton"
                    @tap="goToNext"></Button>

                <TextView id="hidden-field" />

            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { MAPBOX_ACCESS_TOKEN } from "../secrets";
import Services from '../services/services';
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
            origInterval: "",
            noInterval: false,
            intervalNotNumber: false,
            station: {
                location_name: ""
            },
            currentUnit: 0,
            displayInterval: "",
            timeUnits: [_L("seconds"), _L("minutes"), _L("hours"), _L("days"), _L("weeks")]
        };
    },
    props: ["stationId","recording"],
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;

            dbInterface.getStation(this.stationId).then(this.completeSetup);
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
                    stationId: this.stationId,
                    recording: this.recording
                }
            });
        },

        goToNext(event) {
            this.saveLocationName();
            this.saveInterval();

            this.$navigateTo(routes.deployNotes, {
                props: {
                    stationId: this.stationId
                }
            });
        },

        completeSetup(stations) {
            this.station = stations[0];

            if (!this.station.location_name) {
                this.station.location_name = "";
            }
            this.origLocationName = this.station.location_name;
            this.origLatitude = this.station.latitude;
            this.origLongitude = this.station.longitude;
            this.origInterval = this.station.interval;
            this.convertFromSeconds();
            // save original time unit created in convertFromSeconds()
            this.origUnit = this.currentUnit;
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
                                title: this.station.location_name
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
            // this.noLocation = !this.station.location_name || this.station.location_name.length == 0;
            // return !this.noLocation;
        },

        saveLocationName() {
            this.removeFocus("location-name-field");
            this.isEditingLocation = false;

            let valid = this.checkLocationName();
            if (valid && this.origLocationName != this.station.location_name) {
                if (this.mapMarker) {
                    this.mapMarker.update({ title: this.station.location_name });
                }
                dbInterface.setStationLocationName(this.station);
                let configChange = {
                    station_id: this.station_id,
                    before: this.origLocationName,
                    after: this.station.location_name,
                    affected_field: "location",
                    author: this.userName
                };
                dbInterface.recordStationConfigChange(configChange);
                this.origLocationName = this.station.location_name;
            }
        },

        saveLocationCoordinates() {
            if (this.origLatitude != this.station.latitude) {
                dbInterface.setStationLocationCoordinates(this.station);
                // store latitude config change
                let configChange = {
                    station_id: this.station_id,
                    before: this.origLatitude,
                    after: this.station.latitude,
                    affected_field: "latitude",
                    author: this.userName
                };
                dbInterface.recordStationConfigChange(configChange);
                this.origLatitude = this.station.latitude;
                // store longitude config change
                configChange = {
                    station_id: this.station_id,
                    before: this.origLongitude,
                    after: this.station.longitude,
                    affected_field: "longitude",
                    author: this.userName
                };
                dbInterface.recordStationConfigChange(configChange);
                this.origLongitude = this.station.longitude;
            }
        },

        convertFromSeconds() {
            let displayValue = this.station.interval;
            // this.currentUnit is an index into timeUnits:
            // ["seconds", "minutes", "hours", "days", "weeks"]
            if (this.station.interval < 60) {
                // seconds
                this.currentUnit = 0;
            } else if (this.station.interval < 3600) {
                // minutes
                this.currentUnit = 1;
                displayValue /= 60;
                displayValue = Math.round(displayValue);
            } else if (this.station.interval < 86400) {
                // hours
                this.currentUnit = 2;
                displayValue /= 3600;
                displayValue = Math.round(displayValue);
            } else if (this.station.interval < 604800) {
                // days
                this.currentUnit = 3;
                displayValue /= 86400;
                displayValue = Math.round(displayValue);
            } else {
                // weeks
                this.currentUnit = 4;
                displayValue /= 604800;
                displayValue = displayValue.toFixed(1);
            }
            this.displayInterval = displayValue;
        },

        convertToSeconds() {
            switch (this.currentUnit) {
                case 0:
                    this.station.interval = this.displayInterval;
                    break;
                case 1:
                    this.station.interval = this.displayInterval * 60;
                    break;
                case 2:
                    this.station.interval = this.displayInterval * 3600;
                    break;
                case 3:
                    this.station.interval = this.displayInterval * 86400;
                    break;
                case 4:
                    this.station.interval = this.displayInterval * 604800;
                    break;
                default:
                    break;
            }
        },

        checkInterval() {
            // reset these first
            this.noInterval = false;
            this.intervalNotNumber = false;
            // then check
            this.noInterval =
                !this.displayInterval || this.displayInterval == 0 || this.displayInterval.length == 0;
            if (this.noInterval) {
                return false;
            }
            this.intervalNotNumber = isNaN(this.displayInterval);
            return !this.intervalNotNumber;
        },

        saveInterval(event) {
            this.removeFocus("interval-field");

            let valid = this.checkInterval();
            if (valid) {
                this.convertToSeconds(); // assigns displayInterval to this.station.interval
                if (this.origInterval != this.station.interval) {
                    dbInterface.setStationInterval(this.station);
                    let configChange = {
                        station_id: this.station.station_id,
                        before: this.origInterval,
                        after: this.station.interval,
                        affected_field: "interval",
                        author: this.userName
                    };
                    dbInterface.recordStationConfigChange(configChange);
                    this.origInterval = this.station.interval;
                    this.origUnit = this.currentUnit;
                }
            }
        },

        onSelectedIndexChanged(event) {
            // console.log(event.oldIndex, event.newIndex)
            this.currentUnit = event.newIndex;
            this.saveInterval();
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
#location-name-field {
    padding: 0;
    width: 100%;
    font-size: 18;
    border-bottom-color: $fk-primary-black;
    border-bottom-width: 1;
}

#interval-field {
    padding: 0;
    font-size: 18;
    width: 50%;
    border-bottom-width: 1;
    border-bottom-color: $fk-primary-black;
}

.char-count {
    width: 10%;
    margin-top: 10;
    margin-left: 5;
}

.validation-error {
    width: 100%;
    font-size: 12;
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
}

.round {
    width: 40;
    padding-bottom: 10;
    padding-top: 8;
    margin-top: 1;
    border-radius: 20;
}

#hidden-field {
    opacity: 0;
}
</style>
