<template>
    <Page class="page plain" @loaded="onPageLoaded">
        <PlatformHeader
            :title="_L('deployment')"
            :subtitle="currentStation.name"
            :onBack="goBack"
            :canCancel="true"
            :onCancel="onNavCancel"
            :canNavigateSettings="false"
        />
        <GridLayout rows="auto,*,auto">
            <StackLayout row="0" v-if="!linkedFromStation">
                <GridLayout rows="auto" columns="33*,33*,34*" class="top-line-bkgd">
                    <StackLayout colSpan="2" class="top-line"></StackLayout>
                </GridLayout>
                <ConnectionStatusHeader :connected="currentStation.connected" />
            </StackLayout>

            <ScrollView row="1" :rowSpan="linkedFromStation ? 2 : 1">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <StackLayout class="m-x-20">
                        <GridLayout rows="auto,auto" columns="35*,65*" class="m-b-20">
                            <Label row="0" col="0" :text="_L('fieldNotes')" class="size-18 bold"></Label>
                            <Label
                                row="0"
                                col="1"
                                :text="notes.completed + '% ' + _L('complete')"
                                class="size-14 bold blue"
                                verticalAlignment="bottom"
                            />
                            <Label
                                row="1"
                                colSpan="2"
                                :text="_L('provideDetails')"
                                textWrap="true"
                                lineHeight="3"
                                class="lighter size-14 m-t-5"
                            />
                        </GridLayout>

                        <NoteDisplay :note="notes.studyObjective" @open="(ev) => openNote(ev, 'studyObjective')" />
                        <NoteDisplay :note="notes.sitePurpose" @open="(ev) => openNote(ev, 'sitePurpose')" />
                        <NoteDisplay :note="notes.siteCriteria" @open="(ev) => openNote(ev, 'siteCriteria')" />
                        <NoteDisplay :note="notes.siteDescription" @open="(ev) => openNote(ev, 'siteDescription')" />

                        <StackLayout class="m-t-20">
                            <Label :text="_L('photosRequired')" class="size-16 bold m-b-5" />
                            <Label :text="_L('photosInstruction')" class="lighter size-14" />
                            <WrapLayout orientation="horizontal">
                                <StackLayout v-for="(photo, index) in photos" :key="photo.path" class="photo-display">
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
                                <StackLayout class="photo-btn" @tap="onPhotoTap">
                                    <Image src="~/images/Icon_Add_Button.png" width="20" opacity="0.25" class="photo-btn-img" />
                                </StackLayout>
                            </WrapLayout>
                        </StackLayout>

                        <!--
                        <StackLayout class="m-t-30">
                            <Label :text="_L('additionalNotes')" class="size-16 bold m-b-5"></Label>
                            <Label :text="_L('addDetails')" class="lighter size-14 m-b-10" textWrap="true"></Label>
                        </StackLayout>

                        <GridLayout rows="auto" columns="*" v-for="(note, index) in form.additional" :key="index" class="m-b-10">
                            <GridLayout row="0" rows="auto,auto" columns="90*,10*" class="additional-note-section" />
                            <GridLayout row="0" rows="auto" columns="*,15">
                                <GridLayout col="0" rows="auto,auto" columns="90*,10*" class="p-t-20 p-b-10 p-l-10 p-r-10" :dataNote="note" @tap="onEditTap">
                                    <Label row="0" col="0" :text="note.title" class="size-16 m-b-5"></Label>
                                    <Label row="1" col="0" :text="note.value" v-if="note.value" class="size-12 m-b-10"></Label>
                                    <Image rowSpan="2" col="1" v-if="note.audioFile" src="~/images/Icon_Mic.png" width="17" />
                                </GridLayout>
                                <Image
                                    col="1"
                                    horizontalAlignment="right"
                                    verticalAlignment="top"
                                    src="~/images/Icon_Close_Circle.png"
                                    width="15"
                                    class="m-t-5"
                                    :dataNote="note"
                                    @tap="removeAdditionalNote"
                                />
                            </GridLayout>
                        </GridLayout>

                        <FlexboxLayout class="m-b-20">
                            <Image src="~/images/Icon_Add_Button.png" width="20" />
                            <Label :text="_L('addNote')" class="bold m-t-10 p-l-5" @tap="createAdditionalNote"></Label>
                        </FlexboxLayout>
						-->
                    </StackLayout>
                </FlexboxLayout>
            </ScrollView>

            <StackLayout row="2" v-if="!linkedFromStation">
                <Button
                    class="btn btn-primary btn-padded m-b-10"
                    :text="_L('continue')"
                    automationText="nextButton"
                    :isEnabled="notes.valid"
                    @tap="goToReview"
                />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import routes from "@/routes";
import { Dialogs } from "@nativescript/core";
import { Station, Notes, NoteMedia } from "@/store";

import { promiseAfter } from "@/utilities";
import { getAppRelative, getFileName, rebaseAbsolutePath } from "@/lib/fs";

import SharedComponents from "@/components/shared";
import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";
import NoteDisplay from "./NoteDisplay.vue";

import { ActionTypes, SaveNotesAction, AttachNoteMediaMutation } from "@/store";
import * as animations from "../animations";

export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
        NoteDisplay,
    },
    data(): {} {
        return {};
    },
    computed: {
        notes(): Notes {
            return this.$s.state.notes.stations[this.stationId];
        },
        photos(): NoteMedia[] {
            return _.uniqBy(this.notes.photos, (m) => m.path);
        },
        currentStation(): Station {
            return this.$s.getters.legacyStations[this.stationId];
        },
        photoCache(): { [index: string]: any } {
            return this.$s.state.media.photoCache;
        },
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        linkedFromStation: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        rebaseAbsolutePath(path: string): string {
            return rebaseAbsolutePath(path);
        },
        onPageLoaded(args): Promise<void> {
            if (false) {
                console.log("notes", this.$s.state.notes.stations[this.stationId]);
                const paths = this.$s.state.notes.stations[this.stationId].photos.map((p) => p.path);
                return this.$s.dispatch(ActionTypes.LOAD_PICTURES, { paths: paths });
            }
            return Promise.resolve();
        },
        openNote(ev, key: string): Promise<any> {
            console.log("opening", key);
            return this.$navigateTo(routes.deploy.editing, {
                props: {
                    stationId: this.stationId,
                    editingKey: key,
                },
            });
        },
        takePicture(): Promise<any> {
            return this.$services
                .Images()
                .takePicture()
                .then((savedImage) => {
                    console.log("saved image", savedImage);
                    return promiseAfter(100).then(() => {
                        const media = new NoteMedia(getAppRelative(savedImage.path), getFileName(savedImage.path));
                        this.$s.commit(new AttachNoteMediaMutation(this.stationId, null, media, false));
                        return this.$s.dispatch(new SaveNotesAction(this.stationId));
                    });
                });
        },
        selectPicture(): Promise<any> {
            return this.$services
                .Images()
                .findPicture()
                .then((savedImage) => {
                    console.log("saved image", savedImage);
                    return promiseAfter(100).then(() => {
                        const media = new NoteMedia(getAppRelative(savedImage.path), getFileName(savedImage.path));
                        this.$s.commit(new AttachNoteMediaMutation(this.stationId, null, media, false));
                        return this.$s.dispatch(new SaveNotesAction(this.stationId));
                    });
                });
        },
        goBack(ev: any): Promise<any> {
            return Promise.all([animations.pressed(ev), this.$navigateBack({})]);
        },
        onNavCancel(ev: any): Promise<any> {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        goToReview(ev: any): Promise<any> {
            console.log("navigating to review");
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.deploy.review, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        onBackToDetail(ev: any): Promise<any> {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        onPhotoTap(ev: any): Promise<any> {
            return Promise.all([
                animations.pressed(ev),
                Dialogs.action({
                    message: _L("addPhoto"),
                    cancelButtonText: _L("cancel"),
                    actions: [_L("takePicture"), _L("selectFromGallery")],
                }).then((choice) => {
                    if (choice == _L("takePicture")) {
                        return this.takePicture();
                    } else if (choice == _L("selectFromGallery")) {
                        return this.selectPicture();
                    }
                    return;
                }),
            ]);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.alternate-header {
    padding-bottom: 10;
    margin-top: 10;
    border-bottom-width: 1;
    border-color: $fk-gray-lighter;
}
.top-line-bkgd {
    background-color: $fk-gray-lighter;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}

.small-round {
    width: 40;
    padding: 2;
    border-radius: 20;
}

.blue {
    color: $fk-primary-blue;
}

.note-section {
    border-bottom-width: 1;
    border-color: $fk-gray-lighter;
    margin-top: 10;
    margin-bottom: 10;
}
.additional-note-section {
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
    margin-top: 10;
    margin-right: 5;
}

.photo-display,
.photo-btn {
    width: 100;
    height: 100;
    margin: 20;
    background-color: $fk-gray-lightest;
}
.photo-btn-img {
    margin-top: 40;
}
.darker {
    color: $fk-primary-black;
}
.lighter {
    color: $fk-gray-text;
}
</style>
