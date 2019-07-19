<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between">
                <GridLayout rows="auto" columns="10*,90*">
                    <StackLayout col="0" class="round" verticalAlignment="top" @tap="goBack">
                        <Image
                            width="21"
                            src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <StackLayout col="1" class="title-container m-t-10 m-r-30">
                        <Label
                            class="bold text-center"
                            :text="viewTitle"
                            textWrap="true"></Label>
                        <Label
                            class="bold text-center"
                            :text="station.name"
                            textWrap="true"></Label>
                    </StackLayout>
                </GridLayout>

                <Mapbox
                    :accessToken="mapboxToken"
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
                <GridLayout rows="auto,auto" columns="*" class="m-t-20 m-l-10">
                    <Image
                        row="1"
                        width="17"
                        horizontalAlignment="left"
                        v-show="isEditingLocation"
                        @tap="cancelLocationName"
                        src="~/images/Icon_Close.png"></Image>
                    <Label
                        row="1"
                        class="m-y-20 location-name"
                        horizontalAlignment="left"
                        :text="station.location_name"
                        v-show="!isEditingLocation"
                        @tap="toggleLocationEdit"
                        textWrap="true"></Label>
                    <StackLayout row="1" id="location-name-field" class="input-field m-y-20 text-left" @tap="toggleLocationEdit">
                        <FlexboxLayout>
                            <TextField
                                class="input"
                                :isEnabled="true"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                horizontalAlignment="left"
                                v-model="station.location_name"
                                v-show="isEditingLocation"
                                returnKeyType="next"
                                @blur="checkLocationName"></TextField>
                            <Label
                                class="size-10 char-count"
                                horizontalAlignment="right"
                                :text="station.location_name.length"
                                v-show="isEditingLocation"></Label>
                        </FlexboxLayout>
                        <StackLayout class="spacer-top" id="name-field-spacer"></StackLayout>
                        <Label
                            class="validation-error"
                            id="no-location"
                            horizontalAlignment="left"
                            text="locationRequired"
                            textWrap="true"
                            :visibility="noLocation ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="location-too-long"
                            horizontalAlignment="left"
                            text="locationOver40"
                            textWrap="true"
                            :visibility="locationTooLong ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="location-not-printable"
                            horizontalAlignment="left"
                            text="locationNotPrintable"
                            textWrap="true"
                            :visibility="locationNotPrintable ? 'visible' : 'collapsed'"></Label>
                    </StackLayout>
                    <Image
                        row="1"
                        class="m-10"
                        width="17"
                        horizontalAlignment="right"
                        v-show="isEditingLocation"
                        @tap="saveLocationName"
                        src="~/images/Icon_Save.png"></Image>
                </GridLayout>
                <!-- end: Name your location -->

                <!-- Data capture interval -->
                <GridLayout rows="auto,auto,auto,auto" columns="8*,42*,42*,8*" class="m-x-10 m-y-20">
                    <Label row="0" colSpan="4" class="size-20" text="Data capture schedule"></Label>
                    <Label row="1"
                        colSpan="4"
                        class="size-14 m-y-5"
                        text="More frequent data reduces the battery quicker"></Label>
                    <Image row="2"
                        col="0"
                        width="17"
                        v-show="isEditingInterval"
                        @tap="cancelIntervalChange"
                        src="~/images/Icon_Close.png"></Image>
                    <Label row="2"
                        colSpan="2"
                        class="interval-label"
                        horizontalAlignment="left"
                        :text="displayInterval"
                        v-show="!isEditingInterval"
                        @tap="toggleIntervalChange"
                        textWrap="true"></Label>
                    <TextField row="2"
                        col="1"
                        verticalAligment="bottom"
                        class="input interval-input"
                        :isEnabled="true"
                        keyboardType="name"
                        autocorrect="false"
                        autocapitalizationType="none"
                        v-show="isEditingInterval"
                        v-model="displayInterval"
                        @textChange="toggleSecondaryIntervalChange"
                        @blur="checkInterval"></TextField>
                    <StackLayout row="2" col="2" id="drop-down-container">
                        <DropDown :items="timeUnits"
                            @opened="toggleIntervalChange"
                            @selectedIndexChanged="onSelectedIndexChanged"
                            backgroundColor="#F4F5F7"
                            width="100%"
                            class="drop-down"
                            :selectedIndex="currentUnit" ></DropDown>
                    </StackLayout>
                    <Image
                        row="2"
                        col="3"
                        width="17"
                        v-show="isEditingInterval"
                        @tap="saveInterval"
                        src="~/images/Icon_Save.png"></Image>
                    <StackLayout row="3" colSpan="2">
                        <Label
                            class="validation-error"
                            id="no-interval"
                            horizontalAlignment="left"
                            text="Interval must not be blank"
                            textWrap="true"
                            :visibility="noInterval ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="interval-not-numeric"
                            horizontalAlignment="left"
                            text="Interval must be a number"
                            textWrap="true"
                            :visibility="intervalNotNumber ? 'visible' : 'collapsed'"></Label>
                    </StackLayout>
                </GridLayout>

                <Button class="btn btn-primary m-b-10" text="Continue" @tap="goToNext"></Button>

            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import * as geolocation from "nativescript-geolocation";
    import { Accuracy } from "tns-core-modules/ui/enums";
    import { MAPBOX_ACCESS_TOKEN } from "../secrets";
    import routes from "../routes";
    import DatabaseInterface from "../services/db-interface";
    const dbInterface = new DatabaseInterface();

    export default {
        data() {
            return {
                viewTitle: "Deployment",
                mapboxToken: MAPBOX_ACCESS_TOKEN,
                origLocationName: "",
                isEditingLocation: false,
                noLocation: false,
                locationNotPrintable: false,
                locationTooLong: false,
                origInterval: "",
                isEditingInterval: false,
                noInterval: false,
                intervalNotNumber: false,
                station: {
                    location_name: "Name your location",
                },
                currentUnit: 0,
                displayInterval: "",
                timeUnits: ["seconds", "minutes", "hours", "days", "weeks"]
            };
        },
        props: ["stationId"],
        methods: {
            onPageLoaded(args) {
                this.page = args.object;

                this.$userAuth.getCurrentUser()
                    .then(response => {
                        this.user = response;
                    });

                dbInterface.getStation(this.stationId)
                    .then(this.completeSetup);
            },

            onMapReady(args) {
                this.map = args.map;
                this.enableAndGetLocation();
            },

            goBack(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId
                    }
                });
            },

            goToNext(event) {
                this.$navigateTo(routes.deployNotes, {
                    props: {
                        stationId: this.stationId
                    }
                });
            },

            completeSetup(stations) {
                this.station = stations[0];

                if(!this.station.location_name) {this.station.location_name = "Name your location";}
                this.origLocationName = this.station.location_name;
                this.origInterval = this.station.interval;
                this.convertFromSeconds();
                // save original time unit created in convertFromSeconds()
                this.origUnit = this.currentUnit;
            },

            enableAndGetLocation() {
                 geolocation.isEnabled().then(isEnabled => {
                    if(isEnabled) {this.getLocation();}
                    else {
                        geolocation.enableLocationRequest().then(() => {
                            this.getLocation();
                        }, function (e) {
                            // console.log("enableLocationRequest() error: " + (e.message || e));
                        });
                    }
                });
            },

            getLocation() {
                geolocation.getCurrentLocation({
                    desiredAccuracy: Accuracy.high,
                    updateDistance: 10,
                    maximumAge: 20000,
                    timeout: 20000
                }).then(loc => {
                    if (loc) {
                        this.station.latitude = loc.latitude;
                        this.station.longitude = loc.longitude;

                        this.map.setCenter({
                            lat: this.station.latitude,
                            lng: this.station.longitude,
                            animated: false
                        });
                        this.map.setZoomLevel({
                            level: 18,
                            // animated: true
                        });
                        this.mapMarker = {
                            lat: this.station.latitude,
                            lng: this.station.longitude,
                            title: this.station.location_name
                        };
                        this.map.addMarkers([this.mapMarker]);

                        // save coordinates without telling user?
                        this.saveLocationCoordinates();
                    } else {
                        // handle no location?
                    }
                }, e => {
                    console.log("getlocation error: " + e.message);
                });
            },

            toggleLocationEdit() {
                this.isEditingLocation = true;
            },

            checkLocationName() {
                this.noLocation = false;
                this.noLocation = !this.station.location_name || this.station.location_name.length == 0;
                return !this.noLocation;
                // not sure yet what other validation we'll do
            },

            saveLocationName() {
                let valid = this.checkLocationName();
                if(valid) {
                    this.isEditingLocation = false;
                    if(this.mapMarker) {
                        this.mapMarker.update({title: this.station.location_name});
                    }
                    dbInterface.setStationLocationName(this.station);
                    let configChange = {
                        station_id: this.station_id,
                        before: this.origLocationName,
                        after: this.station.location_name,
                        affected_field: "location",
                        author: this.user.name
                    };
                    dbInterface.recordStationConfigChange(configChange);
                    this.origLocationName = this.station.location_name;
                }
            },

            cancelLocationName() {
                this.isEditingLocation = false;
                this.noLocation = false;
                this.locationNotPrintable = false;
                this.locationTooLong = false;
                this.station.location_name = this.origLocationName;
            },

            saveLocationCoordinates() {
                dbInterface.setStationLocationCoordinates(this.station);
                // only record config change for location name, currently
                // add records here for both lat and long?
            },

            convertFromSeconds() {
                let displayValue = this.station.interval;
                // this.currentUnit is an index into timeUnits:
                // ["seconds", "minutes", "hours", "days", "weeks"]
                if(this.station.interval < 60) {
                    // seconds
                    this.currentUnit = 0;
                } else if(this.station.interval < 3600) {
                    // minutes
                    this.currentUnit = 1;
                    displayValue /= 60;
                    displayValue = Math.round(displayValue);
                } else if(this.station.interval < 86400) {
                    // hours
                    this.currentUnit = 2;
                    displayValue /= 3600;
                    displayValue =  Math.round(displayValue);
                } else if(this.station.interval < 604800) {
                    // days
                    this.currentUnit = 3;
                    displayValue /= 86400;
                    displayValue =  Math.round(displayValue);
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

            toggleIntervalChange() {
                this.isEditingInterval = true;
                this.hasBeenToggledBefore = true;
            },

            toggleSecondaryIntervalChange() {
                if(this.hasBeenToggledBefore) {
                    this.isEditingInterval = true;
                }
            },

            checkInterval() {
                // reset these first
                this.noInterval = false;
                this.intervalNotNumber = false;
                // then check
                this.noInterval = !this.displayInterval || this.displayInterval == 0 || this.displayInterval.length == 0;
                if(this.noInterval) {return false}
                this.intervalNotNumber = isNaN(this.displayInterval);
                return !this.intervalNotNumber;
            },

            saveInterval() {
                let valid = this.checkInterval();
                if(valid) {
                    this.convertToSeconds();
                    this.isEditingInterval = false;
                    dbInterface.setStationInterval(this.station);
                    let configChange = {
                        station_id: this.station.station_id,
                        before: this.origInterval,
                        after: this.station.interval,
                        affected_field: "interval",
                        author: this.user.name
                    };
                    dbInterface.recordStationConfigChange(configChange);
                    this.origInterval = this.station.interval;
                    this.origUnit = this.currentUnit;
                }
            },

            cancelIntervalChange() {
                this.isEditingInterval = false;
                this.noInterval = false;
                this.intervalNotNumber = false;
                this.station.interval = this.origInterval;
                this.convertFromSeconds();
                this.currentUnit = this.origUnit;
            },

            onSelectedIndexChanged(event) {
                // console.log(event.oldIndex, event.newIndex)
                this.currentUnit = event.newIndex;
            }

        }
    };
</script>

<style scoped lang="scss">
    // Start custom common variables
    @import '../app-variables';
    // End custom common variables

    // Custom styles
    #location-name-field {
        width: 265;
        color: $fk-primary-black;
    }

    #location-name-field .input {
        width: 245;
        padding: 0;
        border-bottom-color: $fk-primary-black;
        border-bottom-width: 1;
    }

    #location-name-field .char-count {
        width: 25;
        margin-top: 10;
        margin-left: 5;
    }

    .location-name {
        width: 295;
        font-size: 18;
        border-bottom-color: $fk-primary-black;
        border-bottom-width: 1;
    }

    .validation-error {
        width: 245;
        font-size: 12;
        color: $fk-tertiary-red;
        border-top-color: $fk-tertiary-red;
        border-top-width: 2;
        padding-top: 5;
    }

    .interval-input, .interval-label {
        font-size: 18;
        width: 38%;
        padding: 5;
        border-bottom-width: 1;
        border-bottom-color: $fk-primary-black;
    }

    .interval-label {
        width: 48%;
    }

    .round {
        width: 40;
        padding-bottom: 10;
        padding-top: 8;
        margin-top: 1;
        border-radius: 20;
    }
</style>
