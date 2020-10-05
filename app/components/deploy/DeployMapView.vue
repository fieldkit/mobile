<template>
    <Page class="page plain" @loaded="onPageLoaded">
        <PlatformHeader
            :title="_L('deployment')"
            :subtitle="currentStation.name"
            :canNavigateBack="false"
            :canCancel="true"
            :onCancel="onNavCancel"
            :canNavigateSettings="false"
        />
        <GridLayout rows="auto,*,auto">
            <StackLayout row="0">
                <GridLayout rows="auto" columns="33*,33*,34*" class="top-line-bkgd">
                    <StackLayout col="0" class="top-line"></StackLayout>
                </GridLayout>
                <ConnectionStatusHeader :connected="currentStation.connected" />
            </StackLayout>

            <ScrollView row="1">
                <FlexboxLayout flexDirection="column" justifyContent="flex-start">
                    <StackLayout>
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
                        />
                    </StackLayout>

                    <GridLayout rows="auto,auto" columns="*" class="m-t-30 m-b-20 m-x-10 form-container">
                        <StackLayout row="0" class="form-row">
                            <LabeledTextField v-model="form.location" :label="_L('nameYourLocation')" @blur="checkLocationName" />
                            <Label
                                class="validation-error"
                                id="no-location"
                                horizontalAlignment="left"
                                :text="_L('locationRequired')"
                                textWrap="true"
                                :visibility="form.v.required ? 'visible' : 'collapsed'"
                            />
                            <Label
                                class="validation-error"
                                id="location-too-long"
                                horizontalAlignment="left"
                                :text="_L('locationOver255')"
                                textWrap="true"
                                :visibility="form.v.longLength ? 'visible' : 'collapsed'"
                            />
                            <Label
                                class="validation-error"
                                id="location-not-printable"
                                horizontalAlignment="left"
                                :text="_L('locationNotPrintable')"
                                textWrap="true"
                                :visibility="form.v.characters ? 'visible' : 'collapsed'"
                            />
                        </StackLayout>

                        <StackLayout row="1" class="form-row">
                            <ScheduleEditor :schedule="form.schedule" @change="onScheduleChange" v-if="form.schedule" />
                        </StackLayout>
                    </GridLayout>
                </FlexboxLayout>
            </ScrollView>

            <StackLayout row="2">
                <Button
                    class="btn btn-primary btn-padded m-b-10"
                    :text="_L('continue')"
                    :isEnabled="currentStation.connected"
                    automationText="nextButton"
                    @tap="goToNext"
                ></Button>
            </StackLayout>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { isIOS } from "@nativescript/core";
import { MAPBOX_ACCESS_TOKEN } from "@/secrets";
import routes from "@/routes";
import * as ActionTypes from "@/store/actions";
import { Schedule } from "@/store/types";

import SharedComponents from "@/components/shared";
import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";
import ScheduleEditor from "../ScheduleEditor.vue";
import * as animations from "../animations";

export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
        ScheduleEditor,
    },
    data() {
        return {
            ios: isIOS,
            mapboxToken: MAPBOX_ACCESS_TOKEN,
            form: {
                location: "",
                schedule: null,
                v: {
                    any: false,
                    required: false,
                    characters: false,
                    longLength: false,
                },
            },
        };
    },
    props: {
        station: {
            type: Object,
        },
        stationId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        currentNotes(this: any) {
            return this.$store.state.notes.stations[this.stationId];
        },
        currentStation(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        onPageLoaded(this: any, args) {
            this.form.location = this.currentNotes.location || "";
            this.form.schedule = Schedule.getMinimum(this.currentStation.schedules.readings);
        },
        onMapReady(this: any, args) {
            this.map = args.map;
            this.displayStation();
        },
        goBack(this: any, ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.currentStation.id,
                    },
                    transition: {
                        name: "slideRight",
                        duration: 250,
                        curve: "linear",
                    },
                }),
            ]);
        },
        goToNext(this: any, event) {
            return this.saveForm().then(() => {
                return this.$navigateTo(routes.deploy.notes, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            });
        },
        onNavCancel(this: any, ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        displayStation(this: any) {
            const station = this.$store.getters.legacyStations[this.stationId];
            const location = station.location();
            if (!location) {
                return;
            }
            this.map.setCenter({
                lat: location.latitude,
                lng: location.longitude,
                animated: false,
            });
            this.map.setZoomLevel({
                level: 14,
            });
            this.mapMarker = {
                lat: location.latitude,
                lng: location.longitude,
                title: station.name,
                subtitle: _L("readyToDeploy"),
                iconPath: "images/Icon_Map_Dot.png",
            };
            this.map.addMarkers([this.mapMarker]);
        },
        checkLocationName(this: any) {
            this.form.v = {
                required: false,
                long: false,
                characters: false,
                any: false,
            };

            this.form.v.required = this.form.location.length == 0;
            this.form.v.long = this.form.location.length > 40;
            const matches = this.form.location.match(/^[ \w\d~!@#$%^&*()-.'`"]*$/);
            this.form.v.characters = !matches || matches.length == 0;
            this.form.v.any = this.form.v.required || this.form.v.long || this.form.v.characters;
            return !this.form.v.any;
        },
        onScheduleChange(this: any, schedule) {
            console.log("schedule:change", schedule);
            this.form.schedule = schedule;
        },
        saveForm(this: any) {
            if (!this.checkLocationName()) {
                return Promise.reject(new Error("validation error"));
            }
            const station = this.$store.getters.legacyStations[this.stationId];
            return Promise.all([
                this.$store.dispatch(ActionTypes.STATION_LOCATION, { stationId: this.stationId, location: this.form.location }),
            ]).then(() => {
                return Promise.all([
                    this.$store.dispatch(ActionTypes.CONFIGURE_STATION_SCHEDULES, {
                        deviceId: station.deviceId,
                        schedules: { readings: this.form.schedule },
                    }),
                ]);
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.top-line-bkgd {
    background-color: $fk-gray-lighter;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}

.validation-error {
    width: 100%;
    font-size: 12;
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
}

.form-row {
    padding-bottom: 20;
}

.form-container {
    padding: 10;
}
</style>
