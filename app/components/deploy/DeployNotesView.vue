<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout :rows="currentStation.connected || linkedFromStation ? '78,*,80' : '105,*,80'" automationText="deployNotesLayout">
            <StackLayout row="0" v-if="!linkedFromStation">
                <ScreenHeader
                    :title="_L('deployment')"
                    :subtitle="currentStation.name"
                    :onBack="goBack"
                    :canCancel="true"
                    :onCancel="onNavCancel"
                    :canNavigateSettings="false"
                    v-if="!editing"
                />
                <GridLayout rows="auto" columns="33*,33*,34*" class="top-line-bkgd" v-if="!editing">
                    <StackLayout colSpan="2" class="top-line"></StackLayout>
                </GridLayout>
                <StackLayout class="text-center disconnect-warning" v-if="!currentStation.connected && !editing">
                    <Label :text="_L('stationDisconnected')" />
                </StackLayout>
            </StackLayout>

            <GridLayout row="0" rows="auto" columns="85*,15*" :class="editing ? '' : 'alternate-header'" v-if="linkedFromStation">
                <StackLayout row="0" col="0" colSpan="2" verticalAlignment="middle" v-if="!editing">
                    <Label class="title text-center" :text="_L('fieldNotes')"></Label>
                </StackLayout>
                <StackLayout row="0" col="1" class="round-bkgd m-r-10" verticalAlignment="top" @tap="onBackToDetail" v-if="!editing">
                    <Image width="21" src="~/images/Icon_Close.png"></Image>
                </StackLayout>
            </GridLayout>

            <ScrollView row="1" :rowSpan="linkedFromStation ? 2 : 1">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <StackLayout class="m-x-20" v-if="!editing">
                        <GridLayout rows="auto,auto" columns="35*,65*" class="m-b-20">
                            <Label row="0" col="0" :text="_L('fieldNotes')" class="size-18 bold"></Label>
                            <Label
                                row="0"
                                col="1"
                                :text="notes.completed + '% ' + _L('complete')"
                                class="size-14 bold blue"
                                verticalAlignment="bottom"
                            ></Label>
                            <Label
                                row="1"
                                colSpan="2"
                                :text="_L('provideDetails')"
                                textWrap="true"
                                lineHeight="3"
                                class="lighter size-14 m-t-5"
                            ></Label>
                        </GridLayout>

                        <NoteDisplay :note="notes.studyObjective" @open="(ev) => openNote(ev, 'studyObjective')" />
                        <NoteDisplay :note="notes.sitePurpose" @open="(ev) => openNote(ev, 'sitePurpose')" />
                        <NoteDisplay :note="notes.siteCriteria" @open="(ev) => openNote(ev, 'siteCriteria')" />
                        <NoteDisplay :note="notes.siteDescription" @open="(ev) => openNote(ev, 'siteDescription')" />

                        <StackLayout class="m-t-20">
                            <Label :text="_L('photosRequired')" class="size-16 bold m-b-5"></Label>
                            <Label :text="_L('photosInstruction')" class="lighter size-14"></Label>
                            <WrapLayout orientation="horizontal">
                                <StackLayout v-for="(photo, index) in notes.photos" :key="photo.path" class="photo-display">
                                    <StackLayout v-if="photoCache[photo.path]">
                                        <Image :src="photoCache[photo.path]" stretch="aspectFit" />
                                    </StackLayout>
                                    <!- Loading Image... -->
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
                    v-if="!editing"
                />
            </StackLayout>

            <template v-if="editing">
                <StackLayout rowSpan="3">
                    <FieldNoteForm
                        :help="editingHelp"
                        :note="editingNote"
                        v-if="editing"
                        @save="onSaveNote"
                        @cancel="onCancelEditing"
                        @attach-media="onAttachNoteMedia"
                        @remove-audio="onRemoveAudio"
                    />
                </StackLayout>
            </template>
        </GridLayout>
    </Page>
</template>

<script>
import { ImageSource } from "tns-core-modules/image-source";
import routes from "../../routes";

import ScreenHeader from "../ScreenHeader";
import LabeledTextField from "../LabeledTextField";
import FieldNoteForm from "./FieldNoteForm";
import NoteDisplay from "./NoteDisplay";

import * as dialogs from "tns-core-modules/ui/dialogs";
import * as MutationTypes from "../../store/mutations";
import * as ActionTypes from "../../store/actions";
import * as animations from "../animations";

import { NoteData, NotesForm, NoteMedia } from "../../store/modules/notes";

export default {
    components: {
        ScreenHeader,
        NoteDisplay,
        FieldNoteForm,
    },
    data() {
        return {
            editingKey: null,
        };
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
        editing() {
            return this.editingKey !== null;
        },
        editingNote() {
            if (this.editingKey) {
                console.log("data", this.editingKey, this.notes);
                return this.notes.notes[this.editingKey] || new NoteData();
            }
            return null;
        },
        editingHelp() {
            if (this.editingKey) {
                console.log("help", this.editingKey, this.notes);
                return this.notes.help[this.editingKey];
            }
            return null;
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
        onPageLoaded(args) {
            console.log("notes", this.$store.state.notes.stations[this.stationId]);
            const paths = this.$store.state.notes.stations[this.stationId].photos.map((p) => p.path);
            return this.$store.dispatch(ActionTypes.LOAD_PICTURES, { paths: paths });
        },
        openNote(ev, key) {
            console.log("opening", key);
            this.editingKey = key;
        },
        onSaveNote({ form }) {
            console.log("saving", this.editingKey, form);

            this.$store.commit(MutationTypes.UPDATE_NOTE, { stationId: this.stationId, key: this.editingKey, update: form });

            this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId }).then(() => {
                this.editingKey = null;
            });
        },
        onAttachNoteMedia(media) {
            if (NoteMedia.isAudio(media)) {
                this.$store.commit(MutationTypes.ATTACH_NOTE_MEDIA, { stationId: this.stationId, key: this.editingKey, audio: media });
            } else {
                this.$store.commit(MutationTypes.ATTACH_NOTE_MEDIA, { stationId: this.stationId, key: this.editingKey, photo: media });
            }
            return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId });
        },
        onRemoveAudio(note, media) {
            this.$store.commit(MutationTypes.REMOVE_NOTE_MEDIA, { stationId: this.stationId, key: this.editingKey, audio: media });
            return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId });
        },
        takePicture() {
            return this.$store.dispatch(ActionTypes.TAKE_PICTURE).then((savedImage) => {
                console.log("saved image", savedImage);
                return Promise.delay(100).then(() => {
                    this.$store.commit(MutationTypes.ATTACH_NOTE_MEDIA, {
                        stationId: this.stationId,
                        key: null,
                        photo: new NoteMedia(savedImage.path),
                    });
                    return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId });
                });
            });
        },
        selectPicture() {
            return this.$store.dispatch(ActionTypes.FIND_PICTURE).then((savedImage) => {
                console.log("saved image", savedImage);
                return Promise.delay(100).then(() => {
                    this.$store.commit(MutationTypes.ATTACH_NOTE_MEDIA, {
                        stationId: this.stationId,
                        key: null,
                        photo: new NoteMedia(savedImage.path),
                    });
                    return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId });
                });
            });
        },
        onCancelEditing() {
            this.editingKey = null;
        },
        goBack(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.deploy.start, {
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
        onNavCancel(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        goToReview(ev) {
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
        onBackToDetail(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        onPhotoTap(ev) {
            return Promise.all([
                animations.pressed(ev),
                dialogs
                    .action({
                        message: _L("addPhoto"),
                        cancelButtonText: _L("cancel"),
                        actions: [_L("takePicture"), _L("selectFromGallery")],
                    })
                    .then((choice) => {
                        if (choice == _L("takePicture")) {
                            return this.takePicture();
                        } else if (choice == _L("selectFromGallery")) {
                            return this.selectPicture();
                        }
                    }),
            ]);
        },
    },
};
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
