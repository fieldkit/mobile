<template>
    <Page class="page plain" @loaded="onPageLoaded">
        <PlatformHeader :title="_L('deploymentReview')" :subtitle="currentStation.name" :onBack="goBack" :canNavigateSettings="false" />
        <GridLayout rows="auto,*,auto">
            <StackLayout row="0">
                <GridLayout rows="auto" columns="33*,33*,30*,4*" class="top-line-bkgd">
                    <StackLayout colSpan="3" class="top-line"></StackLayout>
                </GridLayout>
                <ConnectionStatusHeader :connected="currentStation.connected" />
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
                        <StackLayout
                            v-for="(i, index) in currentStation.schedules.readings.intervals"
                            orientation="horizontal"
                            class="schedule-interval"
                            :key="index"
                        >
                            <Label :text="i.start | prettyTimeOfDay" />
                            <Label :text="' to '" />
                            <Label :text="i.end | prettyTimeOfDay" />
                            <Label :text="' ' + _L('every') + ' '" />
                            <Label :text="i.interval | prettyDurationSeconds" />
                        </StackLayout>
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
                            <StackLayout v-for="(photo, index) in notes.photos" :key="photo.path" class="photo-display">
                                <StackLayout v-if="photoCache[photo.path]">
                                    <Image
                                        :src="photoCache[photo.path]"
                                        stretch="aspectFit"
                                        decodeWidth="400"
                                        decodeHeight="400"
                                        loadMode="async"
                                    />
                                </StackLayout>
                                <StackLayout v-if="!photoCache[photo.path] && photo.path">
                                    <Image
                                        :src="rebaseAbsolutePath(photo.path)"
                                        stretch="aspectFit"
                                        decodeWidth="400"
                                        decodeHeight="400"
                                        loadMode="async"
                                    />
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

<script lang="ts">
import Vue from "vue";
import { routes } from "@/routes";
import { ActionTypes, Station, Notes, NoteForm } from "@/store";
import * as animations from "../animations";
import SharedComponents from "@/components/shared";
import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";
import { rebaseAbsolutePath } from "@/lib/fs";

export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data(): {} {
        return {};
    },
    computed: {
        notes(this: any): Notes {
            return this.$s.state.notes.stations[this.stationId];
        },
        currentStation(this: any): Station {
            return this.$s.getters.legacyStations[this.stationId];
        },
        photoCache(this: any): any {
            return this.$s.state.media.photoCache;
        },
        visibleNotes(this: any): NoteForm[] {
            return [this.notes.studyObjective, this.notes.sitePurpose, this.notes.siteCriteria, this.notes.siteDescription];
        },
    },
    methods: {
        onPageLoaded(): void {
            console.log("review loaded", this.stationId);
            console.log("review loaded", this.currentStation);
        },
        async goBack(ev: any): Promise<void> {
            await Promise.all([animations.pressed(ev), this.$navigateBack()]);
        },
        editLocation(ev: any): Promise<any> {
            return Promise.all([
                this.$navigateTo(routes.deploy.start, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        editNotes(ev: any): Promise<any> {
            return Promise.all([
                this.$navigateTo(routes.deploy.notes, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        deployStation(ev: any, station: Station): Promise<any> {
            ev.object.text = _L("processing");

            return this.$s.dispatch(ActionTypes.DEPLOY_STATION, { deviceId: station.deviceId }).then(() => {
                return this.$navigateTo(routes.station.detail, {
                    props: {
                        stationId: this.stationId,
                        redirectedFromDeploy: true,
                    },
                });
            });
        },
        rebaseAbsolutePath(path: string): string {
            return rebaseAbsolutePath(path);
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
