<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" class="p-t-10">
                <ScreenHeader
                    :title="viewTitle"
                    :subtitle="stationName"
                    :onBack="goBack"
                    :canNavigateSettings="false"
                />
                <GridLayout rows="auto" columns="33*,33*,30*,4*" class="top-line-bkgd">
                    <StackLayout colSpan="3" class="top-line"></StackLayout>
                </GridLayout>

                <!-- station coordinates -->
                <StackLayout class="review-section">
                    <Label
                        text="Station Coordinates"
                        class="size-16 bold m-b-10"
                    ></Label>
                    <GridLayout rows="auto,auto" columns="35*,65*">
                        <Label
                            row="0"
                            col="0"
                            text="Latitude"
                            class="m-b-5"
                        ></Label>
                        <Label row="1" col="0" :text="station.latitude"></Label>
                        <Label row="0" col="1" text="Longitude"></Label>
                        <Label
                            row="1"
                            col="1"
                            :text="station.longitude"
                        ></Label>
                    </GridLayout>
                </StackLayout>

                <!-- location name and data capture interval -->
                <StackLayout class="review-section">
                    <GridLayout rows="auto" columns="90*,10*">
                        <Label col="0" text="Name your location" />
                        <Image
                            col="1"
                            src="~/images/Icon_Edit.png"
                            width="18"
                            @tap="editLocation"
                        />
                    </GridLayout>
                    <Label
                        :text="
                            station.locationName
                                ? station.locationName
                                : 'No name given'
                        "
                    />
                    <Label text="Data capture interval" class="m-t-20 m-b-5" />
                    <Label text="24-hour" />
                    <Label text="Every" class="m-t-20 m-b-5" />
                    <Label :text="getInterval()" />
                </StackLayout>

                <!-- field notes -->
                <StackLayout class="review-section-no-border">
                    <GridLayout
                        rows="auto"
                        columns="30*,60*,10*"
                        class="m-b-10"
                    >
                        <Label
                            row="0"
                            col="0"
                            text="Field Notes"
                            class="size-16 bold"
                        ></Label>
                        <Label
                            row="0"
                            col="1"
                            :text="percentComplete + '% Complete'"
                            class="size-12 blue"
                            verticalAlignment="bottom"
                        ></Label>
                        <Image
                            row="0"
                            col="2"
                            src="~/images/Icon_Edit.png"
                            width="18"
                            @tap="editNotes"
                        />
                    </GridLayout>
                    <StackLayout
                        v-for="note in completeNotes"
                        :key="note.field"
                    >
                        <Label
                            :text="note.title"
                            class="size-14 m-t-10 m-b-5"
                        ></Label>
                        <Label
                            v-if="note.value"
                            :text="note.value"
                            class="size-12"
                            textWrap="true"
                        ></Label>
                        <Image
                            v-if="note.audioFile"
                            src="~/images/Icon_Mic.png"
                            width="17"
                            horizontalAlignment="left"
                        />
                    </StackLayout>
                </StackLayout>

                <!-- photos -->
                <StackLayout class="review-section-no-border">
                    <Label text="Photos (1 required)" class="size-12"></Label>
                    <WrapLayout orientation="horizontal">
                        <StackLayout
                            v-for="photo in photos"
                            :key="photo.id"
                            class="photo-display"
                        >
                            <Image :src="photo.src" stretch="aspectFit" />
                        </StackLayout>
                    </WrapLayout>
                </StackLayout>

                <!-- additional notes -->
                <GridLayout
                    row="0"
                    rows="auto,auto"
                    columns="90*,10*"
                    class="additional-note-section"
                    v-for="note in additionalNotes"
                    :key="note.fieldNoteId"
                >
                    <Label
                        row="0"
                        col="0"
                        :text="note.title"
                        class="size-14 m-b-5"
                    ></Label>
                    <Label
                        row="1"
                        col="0"
                        :text="note.value"
                        v-if="note.value"
                        class="size-12 m-b-10"
                        textWrap="true"
                    ></Label>
                    <Image
                        rowSpan="2"
                        col="1"
                        v-if="note.audioFile"
                        src="~/images/Icon_Mic.png"
                        width="17"
                    />
                </GridLayout>

                <!-- record button -->
                <Button
                    class="btn btn-primary m-20"
                    :text="(
                        station.connected
                        ? 'Record'
                        : 'Must be connected to station to start recording'
                    )"
                    :isEnabled="station.connected"
                    @tap="deployStation"
                ></Button>
            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
import ScreenHeader from "./ScreenHeader";
import Services from "../services/services";
import routes from "../routes";

const dbInterface = Services.Database();
const queryStation = Services.QueryStation();

export default {
    data() {
        return {
            viewTitle: "Deployment Review",
            stationName: "",
            completeNotes: []
        };
    },
    props: ["station", "fieldNotes", "photos", "additionalNotes", "percentComplete"],
    components: {
        ScreenHeader
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            this.stationName = this.station.name;

            this.fieldNotes.forEach(n => {
                if (n.complete) {
                    this.completeNotes.push(n);
                }
            });
        },

        goBack(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.deployNotes, {
                props: {
                    station: this.station
                }
            });
        },

        editLocation(event) {
            this.$navigateTo(routes.deployMap, {
                props: {
                    station: this.station
                }
            });
        },

        editNotes(event) {
            this.$navigateTo(routes.deployNotes, {
                props: {
                    station: this.station
                }
            });
        },

        getInterval() {
            let displayValue = this.station.interval;
            let unit = "";
            if (this.station.interval < 60) {
                unit = displayValue > 1 ? "seconds" : "second";
            } else if (this.station.interval < 3600) {
                displayValue /= 60;
                displayValue = Math.round(displayValue);
                unit = displayValue > 1 ? "minutes" : "minute";
            } else if (this.station.interval < 86400) {
                displayValue /= 3600;
                displayValue = Math.round(displayValue);
                unit = displayValue > 1 ? "hours" : "hour";
            } else if (this.station.interval < 604800) {
                displayValue /= 86400;
                displayValue = Math.round(displayValue);
                unit = displayValue > 1 ? "days" : "day";
            } else {
                displayValue /= 604800;
                displayValue = Math.round(displayValue);
                unit = displayValue > 1 ? "weeks" : "week";
            }
            return displayValue + " " + unit;
        },

        deployStation(event) {
            event.object.text = "Processing...";
            let savingStation = this.station;
            savingStation.status = "recording";
            dbInterface.setStationDeployStatus(savingStation);

            savingStation.deployStartTime = new Date();
            dbInterface.setStationDeployStartTime(savingStation);

            queryStation.startDataRecording(this.station.url).then(result => {
                this.updatePortal(savingStation).then(() => {
                    this.$navigateTo(routes.stationDetail, {
                        props: {
                            station: this.station
                        }
                    });
                });
            });
        },

        updatePortal(savingStation) {
            if (this.station.portalId && this.station.url != "no_url") {
                let params = {
                    name: this.station.name,
                    device_id: this.station.deviceId,
                    status_json: savingStation
                };
                return this.$portalInterface
                    .updateStation(params, this.station.portalId)
                    .then(stationPortalId => {
                        // console.log("successfully updated", stationPortalId)
                        return Promise.resolve();
                    });
            } else {
                return Promise.resolve();
            }
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
.review-section,
.review-section-no-border {
    font-size: 12;
    border-bottom-width: 1;
    border-color: $fk-gray-lighter;
    margin-top: 10;
    margin-bottom: 10;
    margin-left: 20;
    margin-right: 20;
    padding-bottom: 20;
}
.review-section-no-border {
    border-bottom-width: 0;
    padding-bottom: 0;
}
.additional-note-section {
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
    padding: 10;
    margin-top: 10;
    margin-bottom: 10;
    margin-left: 20;
    margin-right: 20;
}
.blue {
    color: $fk-primary-blue;
}
.photo-display {
    width: 100;
    height: 100;
    margin: 20;
}
</style>
