<template>
    <Page @loaded="onPageLoaded" class="deployment">
        <PlatformHeader
            :title="_L('deployment')"
            :subtitle="currentStation.name"
            :canCancel="true"
            :onCancel="onNavCancel"
            :canNavigateSettings="false"
        />

        <GridLayout rows="auto,*">
            <StackLayout row="0">
                <GridLayout rows="auto" columns="33*,33*,34*" class="top-line-bkgd">
                    <StackLayout col="0" class="top-line"></StackLayout>
                </GridLayout>
                <ConnectionStatusHeader :connected="currentStation.connected" />
            </StackLayout>

            <SkipLayout
                row="1"
                :buttonLabel="_L('continue')"
                :buttonEnabled="currentStation.connected && valid()"
                :buttonVisible="!keyboardVisible"
                @button="goToNext"
                :scrollable="true"
            >
                <FlexboxLayout flexDirection="column" justifyContent="flex-start" @tap="backgroundTap">
                    <StackLayout class="map">
                        <Mapbox
                            :accessToken="token"
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
                                :visibility="form.v.long ? 'visible' : 'collapsed'"
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
                            <Label :text="_L('schedules.readings.heading')" class="size-14 title" />
                            <Label :text="_L('schedules.readings.warning')" class="size-12 subtitle" />

                            <ScheduleEditor
                                :schedule="form.schedule"
                                @change="onScheduleChange"
                                @invalid="onScheduleInvalid"
                                v-if="form.schedule"
                            />
                        </StackLayout>
                    </GridLayout>
                </FlexboxLayout>
            </SkipLayout>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { isAndroid, isIOS, Utils } from "@nativescript/core";
import { Schedule, Station, Notes, ConfigureStationSchedulesAction, NameStationLocationAction } from "@/store";
import { debug, _L } from "@/lib";
import Config from "@/config";

import ScheduleEditor from "@/components/ScheduleEditor.vue";
import ConnectionStatusHeader from "@/components/ConnectionStatusHeader.vue";
import DeployNotesView from "@/components/deploy/DeployNotesView.vue";
import SharedComponents from "@/components/shared";

export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
        ScheduleEditor,
    },
    data(): {
        ios: boolean;
        token: string;
        form: {
            location: string;
            schedule: Schedule | null;
            v: {
                any: boolean;
                required: boolean;
                characters: boolean;
                long: boolean;
                schedule: boolean;
            };
        };
    } {
        return {
            ios: isIOS,
            token: Config.mapbox.token,
            form: {
                location: "",
                schedule: null,
                v: {
                    any: false,
                    required: false,
                    characters: false,
                    long: false,
                    schedule: false,
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
        currentNotes(): Notes {
            return this.$s.state.notes.stations[this.stationId];
        },
        currentStation(): Station {
            return this.$s.getters.legacyStations[this.stationId];
        },
        keyboardVisible(): boolean {
            return this.$s.state.nav.keyboard.visible;
        },
    },
    methods: {
        onPageLoaded(): void {
            this.form.location = this.currentNotes.location || "";
            this.form.schedule = Schedule.getMinimum(this.currentStation.schedules.readings);
        },
        onMapReady(args: any): void {
            const thisAny = this as any;
            thisAny.map = args.map;
            this.displayStation();
        },
        async goBack(): Promise<void> {
            await this.$navigateBack();
        },
        async goToNext(): Promise<void> {
            await this.saveForm().then(() => {
                return this.$navigateTo(DeployNotesView, {
                    frame: "stations-frame",
                    props: {
                        stationId: this.stationId,
                    },
                });
            });
        },
        async onNavCancel(): Promise<void> {
            await this.$navigateBack();
        },
        displayStation(): void {
            const thisAny = this as any;
            const station = this.$s.getters.legacyStations[this.stationId];
            const location = station.location();
            if (!location) {
                return;
            }
            thisAny.map.setCenter({
                lat: location.latitude,
                lng: location.longitude,
                animated: false,
            });
            thisAny.map.setZoomLevel({
                level: 14,
            });
            const mapMarker = {
                lat: location.latitude,
                lng: location.longitude,
                title: station.name,
                subtitle: _L("readyToDeploy"),
                iconPath: "images/Icon_Map_Dot.png",
            };
            thisAny.map.addMarkers([mapMarker]);
        },
        checkLocationName(): boolean {
            this.form.v = {
                any: false,
                required: false,
                characters: false,
                long: false,
                schedule: false,
            };

            this.form.v.required = this.form.location.length == 0;
            this.form.v.long = this.form.location.length > 40;
            const matches = this.form.location.match(/^[ \w\d~!@#$%^&*()-.'`"]*$/);
            this.form.v.characters = !matches || matches.length == 0;
            this.form.v.any = this.form.v.required || this.form.v.long || this.form.v.characters;
            return !this.form.v.any;
        },
        onScheduleChange(schedule: Schedule): void {
            debug.log("schedule:change", schedule);
            this.form.schedule = schedule;
        },
        onScheduleInvalid(invalid: boolean): void {
            debug.log("schedule:invalid", invalid);
            this.form.v.schedule = invalid;
        },
        valid(): boolean {
            return !this.form.v.any && !this.form.v.schedule;
        },
        saveForm(): Promise<any> {
            if (!this.checkLocationName()) return Promise.reject(new Error("validation error"));
            if (!this.valid()) return Promise.reject(new Error("validation error"));
            const schedule = this.form.schedule;
            if (!schedule) return Promise.reject(new Error("no schedule"));
            const station = this.$s.getters.legacyStations[this.stationId];
            const existing = station.schedules;
            return Promise.all([this.$s.dispatch(new NameStationLocationAction(this.stationId, this.form.location))]).then(() => {
                return Promise.all([
                    this.$s.dispatch(new ConfigureStationSchedulesAction(station.deviceId, { readings: schedule }, existing)),
                ]);
            });
        },
        backgroundTap(): void {
            debug.log("background-tap");
            if (isAndroid) {
                Utils.ad.dismissSoftInput();
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.deployment {
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
}
</style>
