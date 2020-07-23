<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout :rows="currentStation.connected ? '78,*,80' : '105,*,80'">
            <StackLayout row="0">
                <ScreenHeader
                    :title="_L('deploymentReview')"
                    :subtitle="currentStation.name"
                    :onBack="goBack"
                    :canNavigateSettings="false"
                />
                <GridLayout rows="auto" columns="33*,33*,30*,4*" class="top-line-bkgd">
                    <StackLayout colSpan="3" class="top-line"></StackLayout>
                </GridLayout>
                <StackLayout class="text-center disconnect-warning" v-if="!currentStation.connected">
                    <Label :text="_L('stationDisconnected')" />
                </StackLayout>
            </StackLayout>

            <ScrollView row="1">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <StackLayout class="review-section">
                        <Label :text="_L('stationCoordinates')" class="size-16 bold m-b-10" />
                        <GridLayout rows="auto,auto" columns="35*,65*">
                            <Label row="0" col="0" :text="_L('latitude')" class="m-b-5" />
                            <Label row="1" col="0" :text="currentStation.latitude" />
                            <Label row="0" col="1" :text="_L('longitude')" />
                            <Label row="1" col="1" :text="currentStation.longitude" />
                        </GridLayout>
                    </StackLayout>

                    <StackLayout class="review-section">
                        <GridLayout rows="auto" columns="90*,10*">
                            <Label col="0" :text="_L('nameYourLocation')" />
                            <Image col="1" src="~/images/Icon_Edit.png" width="18" @tap="editLocation" />
                        </GridLayout>
                        <Label :text="notes.location ? notes.location : _L('noNameGiven')" />
                        <Label :text="_L('dataCaptureSchedule')" class="m-t-20 m-b-5" />
                        <Label :text="_L('basic')" />
                        <Label :text="_L('every')" class="m-t-20 m-b-5" />
                        <Label :text="currentStation.interval | prettyDurationSeconds" />
                    </StackLayout>

                    <StackLayout class="review-section-no-border">
                        <GridLayout rows="auto" columns="30*,60*,10*" class="m-b-10">
                            <Label row="0" col="0" :text="_L('fieldNotes')" class="size-16 bold" />
                            <Label
                                row="0"
                                col="1"
                                :text="notes.completed + '% ' + _L('complete')"
                                class="size-12 blue"
                                verticalAlignment="bottom"
                            />
                            <Image row="0" col="2" src="~/images/Icon_Edit.png" width="18" @tap="editNotes" />
                        </GridLayout>
                        <StackLayout v-for="(note, index) in visibleNotes" :key="index">
                            <Label :text="note.help.title" class="size-14 m-t-10 m-b-5" />
                            <Label v-if="note.body" :text="note.body" class="size-12" textWrap="true" />
                            <Image v-if="note.audio.length > 0" src="~/images/Icon_Mic.png" width="17" horizontalAlignment="left" />
                        </StackLayout>
                    </StackLayout>

                    <StackLayout class="review-section-no-border">
                        <Label :text="_L('photosRequired')" class="size-12"></Label>
                        <WrapLayout orientation="horizontal">
                            <StackLayout v-for="photo in notes.photos" :key="photo.path" class="photo-display">
                                <StackLayout v-if="photoCache[photo.path]">
                                    <Image :src="photoCache[photo.path]" stretch="aspectFit" />
                                </StackLayout>
                            </StackLayout>
                        </WrapLayout>
                    </StackLayout>

                    <!--
                    <StackLayout class="additional-notes-label">
                        <Label :text="_L('additionalNotes')" class="size-12"></Label>
                    </StackLayout>
                    <GridLayout
                        row="0"
                        rows="auto,auto"
                        columns="90*,10*"
                        class="additional-note-section"
                        v-for="note in additionalNotes"
                        :key="note.fieldNoteId"
                    >
                        <Label row="0" col="0" :text="note.title" class="size-14 m-b-5"></Label>
                        <Label row="1" col="0" :text="note.value" v-if="note.value" class="size-12 m-b-10" textWrap="true"></Label>
                        <Image rowSpan="2" col="1" v-if="note.audioFile" src="~/images/Icon_Mic.png" width="17" />
                    </GridLayout>
					-->
                </FlexboxLayout>
            </ScrollView>

            <StackLayout row="2">
                <Button
                    class="btn btn-primary btn-padded m-20"
                    :text="currentStation.connected ? _L('record') : _L('mustBeConnectedToRecord')"
                    :isEnabled="currentStation.connected"
                    textWrap="true"
                    @tap="(ev) => deployStation(ev, currentStation)"
                />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../../routes";
import * as ActionTypes from "../../store/actions";
import * as animations from "../animations";

import ScreenHeader from "../ScreenHeader";

export default {
    components: {
        ScreenHeader,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {};
    },
    computed: {
        notes() {
            return this.$store.state.notes.stations[this.stationId];
        },
        currentStation() {
            return this.$store.getters.legacyStations[this.stationId];
        },
        photoCache() {
            return this.$store.state.media.photoCache;
        },
        visibleNotes() {
            return [this.notes.studyObjective, this.notes.sitePurpose, this.notes.siteCriteria, this.notes.siteDescription];
        },
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
        },
        goBack(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.deployNotes, {
                    props: {
                        stationId: this.stationId,
                    },
                    transition: {
                        name: "slideRight",
                        duration: 250,
                        curve: "linear",
                    },
                }),
            ]);
        },
        editLocation(ev) {
            return Promise.all([
                this.$navigateTo(routes.deployMap, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        editNotes(ev) {
            return Promise.all([
                this.$navigateTo(routes.deployNotes, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        deployStation(ev, station) {
            ev.object.text = _L("processing");

            return this.$store.dispatch(ActionTypes.DEPLOY_STATION, { deviceId: station.deviceId }).then(() => {
                return this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId,
                        redirectedFromDeploy: true,
                    },
                });
            });
        },
    },
};
</script>

<style scoped lang="scss">
@import "../../app-variables";

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
.additional-notes-label {
    margin-left: 20;
    margin-right: 20;
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
    margin: 10;
}
</style>
