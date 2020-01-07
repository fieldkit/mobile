<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="75,*,65" automationText="deployNotesLayout">
            <!-- sticky header section and progress bar -->
            <StackLayout row="0" v-if="!linkedFromStation">
                <ScreenHeader
                    :title="viewTitle"
                    :subtitle="stationName"
                    :onBack="goBack"
                    :canNavigateSettings="false"
                    v-if="!isEditing"
                />
                <GridLayout
                    rows="auto"
                    columns="33*,33*,34*"
                    class="top-line-bkgd"
                    v-if="!isEditing"
                >
                    <StackLayout colSpan="2" class="top-line"></StackLayout>
                </GridLayout>
            </StackLayout>

            <!-- alternate header section -->
            <GridLayout
                row="0"
                rows="auto,auto"
                columns="85*,15*"
                class="alternate-header"
                v-if="linkedFromStation"
            >
                <StackLayout
                    row="0"
                    colSpan="2"
                    verticalAlignment="middle"
                    v-if="!isEditing"
                >
                    <Label
                        class="title text-center"
                        text="Field Notes"
                    ></Label>
                </StackLayout>
                <StackLayout
                    row="0"
                    col="2"
                    class="round-bkgd m-r-10"
                    verticalAlignment="top"
                    @tap="onEditDone"
                    v-if="!isEditing"
                >
                    <Image width="21" src="~/images/Icon_Close.png"></Image>
                </StackLayout>
                <StackLayout
                    row="1"
                    colSpan="2"
                    class="alternate-header-border"
                    v-if="!isEditing"
                />
            </GridLayout>

            <!-- main notes view section -->
            <ScrollView row="1">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <StackLayout class="m-x-20" v-if="!isEditing">
                        <!-- top label section -->
                        <GridLayout
                            rows="auto,auto"
                            columns="35*,65*"
                            class="m-b-20"
                        >
                            <Label
                                row="0"
                                col="0"
                                text="Field Notes"
                                class="size-18"
                            ></Label>
                            <Label
                                row="0"
                                col="1"
                                :text="percentComplete + '% ' + _L('complete')"
                                class="size-14 blue"
                                verticalAlignment="bottom"
                            ></Label>
                            <Label
                                row="1"
                                colSpan="2"
                                :text="_L('provideDetails')"
                                textWrap="true"
                                class="size-12 m-t-5"
                            ></Label>
                        </GridLayout>

                        <!-- display the four defined note fields -->
                        <GridLayout
                            rows="auto,auto"
                            columns="90*,10*"
                            v-for="(note, index) in fieldNotes"
                            :key="note.field"
                            :dataNote="note"
                            class="note-section"
                            :automationText="'noteField' + index"
                            @tap="onEditTap"
                        >
                            <Label
                                row="0"
                                col="0"
                                :text="note.title"
                                class="size-16 m-b-5"
                            ></Label>
                            <Label
                                row="1"
                                col="0"
                                :text="
                                    note.value
                                        ? note.value
                                        : note.audioFile
                                        ? ''
                                        : note.instruction
                                "
                                class="size-12 m-b-10"
                            ></Label>
                            <Image
                                rowSpan="2"
                                col="1"
                                v-if="note.audioFile"
                                src="~/images/Icon_Mic.png"
                                width="17"
                            />
                        </GridLayout>

                        <!-- photos -->
                        <StackLayout class="m-t-20">
                            <Label
                                :text="_L('photosRequired')"
                                class="size-16"
                            ></Label>
                            <WrapLayout orientation="horizontal">
                                <StackLayout
                                    v-for="(photo, index) in photos"
                                    :key="photo.id"
                                    class="photo-display"
                                >
                                    <Image
                                        :src="photo.src"
                                        stretch="aspectFit"
                                        :automationText="'deployPhoto' + index"
                                    />
                                </StackLayout>
                                <StackLayout
                                    class="photo-btn"
                                    automationText="addPhoto"
                                    @tap="onPhotoTap"
                                >
                                    <Image
                                        src="~/images/Icon_Add_Button.png"
                                        width="20"
                                        opacity="0.25"
                                        class="photo-btn-img"
                                    />
                                </StackLayout>
                            </WrapLayout>
                        </StackLayout>

                        <!-- additional notes -->
                        <StackLayout class="m-t-30">
                            <Label
                                :text="_L('additionalNotes')"
                                class="size-16 m-b-5"
                            ></Label>
                            <Label
                                :text="_L('addDetails')"
                                class="size-12 m-b-10"
                            ></Label>
                        </StackLayout>

                        <GridLayout
                            rows="auto"
                            columns="*"
                            v-for="note in additionalNotes"
                            :key="note.field"
                            class="m-b-10"
                        >
                            <GridLayout
                                row="0"
                                rows="auto,auto"
                                columns="90*,10*"
                                class="additional-note-section"
                            >
                                <Label
                                    row="0"
                                    col="0"
                                    :text="note.title"
                                    class="size-16 m-b-5"
                                ></Label>
                                <Label
                                    row="1"
                                    col="0"
                                    :text="note.value"
                                    v-if="note.value"
                                    class="size-12 m-b-10"
                                ></Label>
                                <Image
                                    rowSpan="2"
                                    col="1"
                                    v-if="note.audioFile"
                                    src="~/images/Icon_Mic.png"
                                    width="17"
                                />
                            </GridLayout>
                            <GridLayout row="0" rows="auto" columns="*">
                                <Image
                                    horizontalAlignment="right"
                                    src="~/images/Icon_Close_Circle.png"
                                    width="15"
                                    class="m-t-5"
                                    :dataNote="note"
                                    @tap="removeAdditionalNote"
                                />
                            </GridLayout>
                        </GridLayout>

                        <FlexboxLayout class="m-b-20">
                            <Image
                                src="~/images/Icon_Add_Button.png"
                                width="20"
                            />
                            <Label
                                :text="_L('addNote')"
                                class="p-l-5"
                                @tap="createAdditionalNote"
                            ></Label>
                        </FlexboxLayout>
                    </StackLayout>
                </FlexboxLayout>
            </ScrollView>

            <!-- sticky continue button -->
            <StackLayout row="2" v-if="!linkedFromStation">
                <Button
                    class="btn btn-primary m-b-10"
                    :text="_L('continue')"
                    automationText="nextButton"
                    :isEnabled="havePhoto"
                    @tap="goToReview"
                    v-if="!isEditing"
                ></Button>
            </StackLayout>

            <!-- alternate sticky button -->
            <StackLayout row="2" v-if="linkedFromStation">
                <Button
                    class="btn btn-primary m-b-10"
                    :text="_L('save')"
                    @tap="onEditDone"
                    v-if="!isEditing"
                ></Button>
            </StackLayout>

            <!-- field note form -->
            <template v-if="isEditing">
                <StackLayout rowSpan="3">
                    <FieldNoteForm
                        :fieldNote="currentNote"
                        @cancel="cancelEdit"
                        @saveEdit="saveNote"
                        @saveAudio="saveAudio"
                        @removeAudio="removeAudio"
                        v-if="isEditing"
                    />
                </StackLayout>
            </template>
        </GridLayout>
    </Page>
</template>

<script>
import { Folder, path, knownFolders } from "tns-core-modules/file-system";
import { ImageSource, fromFile } from "tns-core-modules/image-source";
import { takePicture, requestPermissions } from "nativescript-camera";
import * as imagepicker from "nativescript-imagepicker";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { isIOS } from "tns-core-modules/platform";
import ScreenHeader from "./ScreenHeader";
import FieldNoteForm from "./FieldNoteForm";
import Services from "../services/services";
import routes from "../routes";

const dbInterface = Services.Database();
const queryStation = Services.QueryStation();

const documents = knownFolders.documents();
const folder = documents.getFolder("FieldKitImages");
const source = new ImageSource();

export default {
    data() {
        return {
            viewTitle: _L("deployment"),
            stationName: "",
            isEditing: false,
            fieldNotes: [
                {
                    field: "studyObjective",
                    value: "",
                    title: _L("studyObjective"),
                    instruction: _L("studyObjectiveInstruction"),
                    complete: false
                },
                {
                    field: "locationPurpose",
                    value: "",
                    title: _L("siteLocation"),
                    instruction: _L("siteLocationInstruction"),
                    complete: false
                },
                {
                    field: "siteCriteria",
                    value: "",
                    title: _L("siteCriteria"),
                    instruction: _L("siteCriteriaInstruction"),
                    complete: false
                },
                {
                    field: "siteDescription",
                    value: "",
                    title: _L("siteDescription"),
                    instruction: _L("siteDescriptionInstruction"),
                    complete: false
                }
            ],
            additionalNotes: [],
            photos: [],
            saveToGallery: true,
            allowsEditing: false,
            keepAspectRatio: true,
            imageSrc: null,
            havePhoto: false,
            percentComplete: 0
        };
    },
    props: ["station", "linkedFromStation"],
    components: {
        ScreenHeader,
        FieldNoteForm
    },
    methods: {
        goBack(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.deployMap, {
                props: {
                    station: this.station
                }
            });
        },

        goToReview() {
            this.$navigateTo(routes.deployReview, {
                props: {
                    station: this.station,
                    fieldNotes: this.fieldNotes,
                    photos: this.photos,
                    percentComplete: this.percentComplete,
                    additionalNotes: this.additionalNotes
                }
            });
        },

        onEditDone(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            let savingStation = this.station;
            savingStation.percentComplete = this.percentComplete;
            dbInterface.setStationPercentComplete(savingStation)
                .then(() => {
                    this.$navigateTo(routes.stationDetail, {
                        props: {
                            station: this.station
                        }
                    });
                });
        },

        onPageLoaded(args) {
            this.page = args.object;

            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;

            dbInterface
                .getFieldNotes(this.station.id)
                .then(this.getFieldMedia)
                .then(this.setup);
        },

        getFieldMedia(notes) {
            this.otherNotes = notes;
            return dbInterface.getFieldMedia(this.station.id);
        },

        setup(media) {
            this.fieldMedia = media;

            this.stationName = this.station.name;

            this.fieldNotes.forEach(note => {
                if (this.station[note.field]) {
                    note.value = this.station[note.field];
                    if (note.value != "") {
                        note.complete = true;
                    }
                }
            });

            // audio and/or additional notes
            this.additionalNotes = [];
            this.otherNotes.forEach(note => {
                let fieldNote = this.fieldNotes.find(n => {
                    return n.field == note.category;
                });
                if (fieldNote && fieldNote.audioFile) {
                    fieldNote.audioFile += "," + note.audioFile;
                } else if (fieldNote) {
                    fieldNote.audioFile = note.audioFile;
                } else {
                    // display additional note
                    this.additionalNotes.push({
                        fieldNoteId: note.id,
                        field: note.category,
                        value: note.note,
                        title: "Field Note",
                        audioFile: note.audioFile,
                        instruction: note.note
                    });
                }
            });

            this.photos = [];
            // load previously saved images
            this.fieldMedia.forEach((img, i) => {
                const dest = path.join(folder.path, img.imageName);
                const imageFromLocalFile = fromFile(dest);
                this.photos.push({
                    id: i,
                    src: imageFromLocalFile
                });
                this.havePhoto = true;
            });
            this.updatePercentComplete();
        },

        onEditTap(event) {
            let note = event.object.dataNote;
            this.currentNote = note;
            this.isEditing = true;
        },

        cancelEdit() {
            this.isEditing = false;
        },

        saveNote(note) {
            let fieldNote = this.fieldNotes.find(n => {
                return n.field == note.field;
            });
            if (!fieldNote) {
                // save as additional note
                this.saveAdditional(note);
                return;
            }

            fieldNote.value = note.value;
            if (note.value) {
                fieldNote.complete = true;
            } else {
                fieldNote.complete = fieldNote.audioFile ? true : false;
            }

            let savingStation = this.station;
            savingStation[note.field] = note.value;
            switch (note.field) {
                case "studyObjective":
                    dbInterface.setStationStudyObjective(savingStation);
                    break;
                case "locationPurpose":
                    dbInterface.setStationLocationPurpose(savingStation);
                    break;
                case "siteCriteria":
                    dbInterface.setStationSiteCriteria(savingStation);
                    break;
                case "siteDescription":
                    dbInterface.setStationSiteDescription(savingStation);
                    break;
            }
            // send note as field note to portal
            let portalParams = {
                stationId: this.station.id,
                created: new Date(),
                category_id: 1,
                note: note.value
            };
            this.$portalInterface.addFieldNote(portalParams);
            this.isEditing = false;
            this.updatePercentComplete();
        },

        createAdditionalNote(event) {
            // note: saving ~requires field to be 'additional'
            this.currentNote = {
                field: "additional",
                value: "",
                title: "Field Note",
                instruction: _L("additionalNoteInstruction"),
                audioFile: ""
            };
            this.isEditing = true;
        },

        saveAdditional(note) {
            this.isEditing = false;
            const newNote = {
                stationId: this.station.id,
                note: note.value,
                category: note.field,
                audioFile: note.audioFile,
                author: this.userName
            };
            dbInterface.insertFieldNote(newNote).then(id => {
                this.additionalNotes.push({
                    fieldNoteId: id,
                    field: note.field,
                    value: note.value,
                    title: "Field Note",
                    instruction: _L("additionalNoteInstruction"),
                    audioFile: note.audioFile
                });
            });
            // send note as field note to portal
            // NOTE: portal category IDs are not set up yet
            let portalParams = {
                stationId: this.station.id,
                created: new Date(),
                category_id: 1,
                note: note.value
            };
            this.$portalInterface.addFieldNote(portalParams);
        },

        removeAdditionalNote(event) {
            let note = event.object.dataNote;
            // confirm removal
            dialogs
                .confirm({
                    title: _L("confirmDeleteNote"),
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel")
                })
                .then(result => {
                    if (result) {
                        let index = this.additionalNotes.findIndex(n => {
                            return n.fieldNoteId == note.fieldNoteId;
                        });
                        if (index > -1) {
                            this.additionalNotes.splice(index, 1);
                        }
                        dbInterface.removeFieldNote(note.fieldNoteId);
                        if (note.audioFile && note.audioFile != "") {
                            dbInterface.removeFieldNoteByAudioFile(
                                note.audioFile
                            );
                        }

                        // *** NOTE: probably more places need this:
                        // TODO: delete from portal
                    }
                });
        },

        saveAudio(note, recording) {
            let fieldNote = this.fieldNotes.find(n => {
                return n.field == note.field;
            });
            if (!fieldNote) {
                // additional note audio
                // gets saved elsewhere
                return;
            }
            fieldNote.complete = true;
            if (fieldNote.audioFile) {
                fieldNote.audioFile += "," + recording;
            } else {
                fieldNote.audioFile = recording;
            }
            const audioNote = {
                stationId: this.station.id,
                note: note.value,
                category: note.field,
                audioFile: recording,
                author: this.userName
            };
            dbInterface.insertFieldNote(audioNote);
            this.updatePercentComplete();
        },

        removeAudio(note, filename) {
            let fieldNote = this.fieldNotes.find(n => {
                return n.field == note.field;
            });
            if (!fieldNote) {
                // additional note audio
                // hasn't been saved in db yet
                return;
            }

            let recordings = fieldNote.audioFile.split(",");
            let index = recordings.indexOf(filename);
            if (index > -1) {
                recordings.splice(index, 1);
            }
            fieldNote.audioFile = recordings.join(",");
            if (!fieldNote.value && !fieldNote.audioFile) {
                fieldNote.complete = false;
            }
            this.updatePercentComplete();

            dbInterface.removeFieldNoteByAudioFile(filename);
        },

        updatePercentComplete() {
            // Note: hard-coded total - 4 notes and 1 photo
            const total = 5.0;
            let done = 0;
            if (this.photos.length > 0) {
                done += 1;
            }
            this.fieldNotes.forEach(n => {
                if (n.complete) {
                    done += 1;
                }
            });
            this.percentComplete = Math.round((done / total) * 100);
        },

        onPhotoTap(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            dialogs
                .action({
                    message: _L("addPhoto"),
                    cancelButtonText: _L("cancel"),
                    actions: [_L("takePicture"), _L("selectFromGallery")]
                })
                .then(result => {
                    if (result == _L("takePicture")) {
                        this.takePicture();
                    } else if (result == _L("selectFromGallery")) {
                        this.selectPicture();
                    }
                });
        },

        takePicture() {
            requestPermissions().then(
                () => {
                    takePicture({
                        keepAspectRatio: this.keepAspectRatio,
                        saveToGallery: this.saveToGallery,
                        allowsEditing: this.allowsEditing
                    }).then(
                        imageAsset => {
                            this.imageSrc = imageAsset;
                            this.savePicture();
                        },
                        err => {
                            // console.log("Error -> " + err.message);
                        }
                    );
                },
                () => {
                    // console.log('Camera permissions rejected');
                }
            );
        },

        selectPicture() {
            let context = imagepicker.create({
                mode: "single" // only one picture can be selected
            });
            context
                .authorize()
                .then(() => {
                    this.imageSrc = null;
                    return context.present();
                })
                .then(selection => {
                    this.imageSrc = selection[0];
                    this.savePicture();
                })
                .catch(e => {
                    // console.log(e);
                });
        },

        savePicture() {
            this.havePhoto = true;
            const name = this.station.id + "_img_" + Date.now() + ".jpg";
            const dest = path.join(folder.path, name);
            let media = {
                stationId: this.station.id,
                imageName: name,
                imageLabel: "",
                category: "default",
                author: this.userName
            };
            dbInterface.insertFieldMedia(media);
            this.updatePercentComplete();
            if (isIOS) {
                this.photos.push({
                    id: this.photos.length + 1,
                    src: this.imageSrc
                });
            }

            source.fromAsset(this.imageSrc).then(
                imageSource => {
                    let saved = imageSource.saveToFile(dest, "jpg");
                    if (saved) {
                        // send image to portal as field note media
                        let params = {
                            stationId: this.station.id,
                            pathDest: dest
                        };
                        this.$portalInterface
                            .addFieldNoteMedia(params)
                            .then(result => {
                                // console.log("result? ---->", result);
                            });
                    }
                },
                error => {
                    // console.log("Error saving image", error);
                }
            );
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.alternate-header {
    padding-bottom: 10;
    margin-top: 10;
}
.alternate-header-border {
    padding-top: 10;
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
    padding: 10;
    margin-top: 10;
    margin-bottom: 10;
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
</style>
