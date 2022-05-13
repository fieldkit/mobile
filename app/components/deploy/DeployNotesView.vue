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

                        <NoteDisplay :note="notes.studyObjective" @open="() => openNote('studyObjective')" />
                        <NoteDisplay :note="notes.sitePurpose" @open="() => openNote('sitePurpose')" />
                        <NoteDisplay :note="notes.siteCriteria" @open="() => openNote('siteCriteria')" />
                        <NoteDisplay :note="notes.siteDescription" @open="() => openNote('siteDescription')" />

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
                                <StackLayout class="photo-display" @tap="onAddPhoto">
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
import { Dialogs } from "@nativescript/core";

import { getAppRelative, getFileName, rebaseAbsolutePath, promiseAfter } from "@/lib";

import NoteDisplay from "./NoteDisplay.vue";
import EditNoteView from "./EditNoteView.vue";
import DeployReviewView from "./DeployReviewView.vue";
// import Blank from "@/components/Blank.vue";
import StationDetailView from "@/components/StationDetailView.vue";
import ConnectionStatusHeader from "@/components/ConnectionStatusHeader.vue";
import SharedComponents from "@/components/shared";

import { Station, Notes, NoteMedia, SaveNotesAction, RemoveNoteMediaMutation, AttachNoteMediaMutation } from "@/store";

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
        onPageLoaded(): void {},
        async openNote(key: string): Promise<void> {
            debug.log("opening", key);
            await this.$navigateTo(EditNoteView, {
                frame: "stations-frame",
                props: {
                    stationId: this.stationId,
                    editingKey: key,
                },
            });
        },
        async takePicture(): Promise<void> {
            await this.$services
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
        async selectPicture(): Promise<void> {
            await this.$services
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
        async goBack(): Promise<void> {
            await this.$navigateBack();
        },
        async onNavCancel(): Promise<void> {
            await this.$navigateTo(StationDetailView, {
                frame: "stations-frame",
                clearHistory: true,
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToReview(): Promise<void> {
            debug.log("navigating to review");
            await this.$navigateTo(DeployReviewView, {
                frame: "stations-frame",
                props: {
                    stationId: this.stationId,
                },
            });
            debug.log("navigating done");
        },
        onBackToDetail(): Promise<void> {
            return this.onNavCancel();
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
        async onAddPhoto(): Promise<void> {
            const choice = await Dialogs.action({
                message: _L("addPhoto"),
                cancelButtonText: _L("cancel"),
                actions: [_L("takePicture"), _L("selectFromGallery")],
            });
            if (choice == _L("takePicture")) {
                await this.takePicture();
            } else if (choice == _L("selectFromGallery")) {
                await this.selectPicture();
            }
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

.photo-display {
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
