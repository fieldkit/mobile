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
        <GridLayout rows="auto,*">
            <StackLayout row="0" v-if="!linkedFromStation">
                <GridLayout rows="auto" columns="33*,33*,34*" class="top-line-bkgd">
                    <StackLayout colSpan="2" class="top-line"></StackLayout>
                </GridLayout>
                <ConnectionStatusHeader :connected="currentStation.connected" />
            </StackLayout>

            <SkipLayout
                row="1"
                :buttonLabel="_L('continue')"
                :buttonEnabled="notes.valid"
                :buttonVisible="!linkedFromStation"
                :scrollable="true"
                @button="goToReview"
            >
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
                                <StackLayout
                                    v-for="(photo, index) in photos"
                                    :key="photo.path"
                                    class="photo-display"
                                    @tap="onTapPhoto(photo)"
                                >
                                    <StackLayout v-if="photo.path">
                                        <Image
                                            :src="rebaseAbsolutePath(photo.path)"
                                            stretch="aspectFit"
                                            decodeWidth="400"
                                            decodeHeight="400"
                                            loadMode="async"
                                        />
                                    </StackLayout>
                                </StackLayout>
                                <StackLayout class="photo-btn" @tap="onAddPhoto">
                                    <Image src="~/images/Icon_Add_Button.png" width="20" opacity="0.25" class="photo-btn-img" />
                                </StackLayout>
                            </WrapLayout>
                        </StackLayout>
                    </StackLayout>
                </FlexboxLayout>
            </SkipLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { routes } from "@/routes";
import { Dialogs } from "@nativescript/core";

import { getAppRelative, getFileName, rebaseAbsolutePath, promiseAfter } from "@/lib";

import SharedComponents from "@/components/shared";
import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";
import NoteDisplay from "./NoteDisplay.vue";

import { Station, Notes, NoteMedia, ActionTypes, SaveNotesAction, RemoveNoteMediaMutation, AttachNoteMediaMutation } from "@/store";
import * as animations from "../animations";

import { debug, _L } from "@/lib";

export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
        NoteDisplay,
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
                debug.log("notes", this.$s.state.notes.stations[this.stationId]);
                const paths = this.$s.state.notes.stations[this.stationId].photos.map((p) => p.path);
                return this.$s.dispatch(ActionTypes.LOAD_PICTURES, { paths: paths });
            }
            return Promise.resolve();
        },
        openNote(ev, key: string): Promise<any> {
            debug.log("opening", key);
            return this.$deprecatedNavigateTo(routes.deploy.editing, {
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
                    debug.log("saved image", savedImage);
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
                    debug.log("saved image", savedImage);
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
                this.$deprecatedNavigateTo(routes.station.detail, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        goToReview(ev: any): Promise<any> {
            debug.log("navigating to review");
            return Promise.all([
                animations.pressed(ev),
                this.$deprecatedNavigateTo(routes.deploy.review, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        onBackToDetail(ev: any): Promise<any> {
            return Promise.all([
                animations.pressed(ev),
                this.$deprecatedNavigateTo(routes.station.detail, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        async onTapPhoto(photo: NoteMedia) {
            const confirm = await Dialogs.confirm({
                title: "Do you want to remove this photo?",
                okButtonText: _L("yes"),
                cancelButtonText: _L("no"),
            });
            if (!confirm) {
                return;
            }
            this.$s.commit(new RemoveNoteMediaMutation(this.stationId, null, photo));
            await this.$s.dispatch(new SaveNotesAction(this.stationId));
        },
        onAddPhoto(): Promise<any> {
            return Promise.all([
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
