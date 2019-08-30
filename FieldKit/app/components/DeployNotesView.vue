<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout>
                <GridLayout rows="auto" columns="10*,90*">
                    <StackLayout col="0" class="round" verticalAlignment="top" @tap="goBack">
                        <Image width="21" src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <StackLayout col="1" class="title-container m-t-10 m-r-30">
                        <Label class="bold text-center" :text="viewTitle" textWrap="true"></Label>
                        <Label class="bold m-b-10 text-center" :text="station.name" textWrap="true"></Label>
                    </StackLayout>
                </GridLayout>

                <!-- Add audio note and photo -->
                <GridLayout rows="auto" columns="*,*" class="m-x-10">
                    <StackLayout row="0"
                        col="0"
                        class="col left-col"
                        automationText="addAudioNote"
                        @tap="onAudioTap">
                        <Label class="text-center size-18" :text="_L('audioNotes')"></Label>
                    </StackLayout>
                    <StackLayout row="0"
                        col="1"
                        class="col right-col"
                        automationText="addPhoto"
                        @tap="onPhotoTap">
                        <Label class="text-center size-18" :text="_L('photo')"></Label>
                    </StackLayout>
                </GridLayout>
                <!-- end: Add audio note and photo -->

                <!-- Add text note -->
                <GridLayout rows="auto", columns="*" class="m-10">
                    <TextView class="size-18"
                        id="note-text-field"
                        :hint="_L('notesInstructions')"
                        v-model="noteText"
                        @blur="saveNote"
                        textWrap="true" ></TextView>
                </GridLayout>
                <!-- end: Add text note -->

                <!-- List audio recordings -->
                <GridLayout rows="auto" columns="90*,10*" v-for="(r, recordingIndex) in displayRecordings"
                    :key="r"
                    class="link-style"
                    orientation="vertical">
                    <Label col="0"
                        :text="r"
                        :data="r"
                        :automationText="'audioRecording' + recordingIndex"
                        textWrap="true"
                        @tap=playAudio />
                    <Image col="1"
                        width="17"
                        class="small-round"
                        :automationText="'removeAudioRecording' + recordingIndex"
                        :data="r"
                        @tap="removeRecording"
                        src="~/images/Icon_Close.png"></Image>
                </GridLayout>
                <!-- end: List audio recordings -->

                <!-- Add photo -->
                <GridLayout rows="*, auto" columns="*" v-show="havePhoto" class="m-10 photo-label">
                    <Image row="0"
                        :src="imageSrc"
                        id="image"
                        automationText="deploymentPhoto"
                        stretch="aspectFit" />
                    <TextView row="1"
                        :hint="_L('describePhoto')"
                        id="photo-label-input"
                        @blur="saveLabel"
                        v-model="labelText"></TextView>
                </GridLayout>
                <!-- end: Add photo -->

                <StackLayout v-show="havePhoto" class="m-15">
                    <Label :text="_L('startRecordingPrompt')" textWrap="true" />
                    <Button class="btn btn-primary m-b-10" :text="_L('record')" @tap="deployStation"></Button>
                </StackLayout>

                <TextView id="hidden-field" />

            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script>
import { Folder, path, knownFolders } from "tns-core-modules/file-system";
import { ImageSource, fromFile } from "tns-core-modules/image-source";
import { takePicture, requestPermissions } from "nativescript-camera";
import * as imagepicker from "nativescript-imagepicker";
import * as dialogs from "tns-core-modules/ui/dialogs";
import routes from "../routes";
import DatabaseInterface from "../services/db-interface";
import AudioInterface from "../services/audio-interface";
import QueryStation from "../services/query-station";

const dbInterface = new DatabaseInterface();
const audioInterface = new AudioInterface();
const queryStation = new QueryStation();
const documents = knownFolders.documents();
const folder = documents.getFolder("FieldKitImages");
const source = new ImageSource();

// note: global variable _L not defined here
// so month name abbreviations are set below
let monthNames = [];

export default {
    data() {
        return {
            viewTitle: _L("deployment"),
            station: {
                name: "FieldKit Station"
            },
            saveToGallery: true,
            allowsEditing: true,
            keepAspectRatio: true,
            width: 640,
            height: 360,
            imageSrc: null,
            labelText: "",
            origLabel: "",
            havePhoto: false,
            pathDest: "",
            deployImageName: "",
            origImageName: "",
            noteText: "",
            origNote: "",
            recordings: "",
            origRecordings: "",
            newRecordings: {},
            displayRecordings: []
        };
    },
    props: ["stationId"],
    methods: {
        goBack(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.deployMap, {
                props: {
                    stationId: this.stationId
                }
            });
        },

        onPageLoaded(args) {
            this.page = args.object;

            monthNames = [
                _L("jan"),
                _L("feb"),
                _L("mar"),
                _L("apr"),
                _L("may"),
                _L("jun"),
                _L("jul"),
                _L("aug"),
                _L("sep"),
                _L("oct"),
                _L("nov"),
                _L("dec")
            ];

            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;

            dbInterface
                .getStation(this.stationId)
                .then(this.getModules)
                .then(this.setupModules)
                .then(this.completeSetup);
        },

        getModules(station) {
            this.station = station[0];
            return dbInterface.getModules(this.station.id);
        },

        linkModulesAndSensors(results) {
            results.forEach(r => {
                r.resultPromise.then(sensors => {
                    r.module.sensorObjects = sensors;
                });
            });
        },

        getSensors(moduleObject) {
            let result = dbInterface.getSensors(moduleObject.id);
            return { resultPromise: result, module: moduleObject };
        },

        setupModules(modules) {
            this.station.moduleObjects = modules;
            return Promise.all(this.station.moduleObjects.map(this.getSensors)).then(
                this.linkModulesAndSensors
            );
        },

        completeSetup() {
            this.noteText = this.station.deploy_note;
            this.origNote = this.noteText;
            this.recordings = this.station.deploy_audio_files;
            this.origRecordings = this.recordings;
            if (this.recordings) {
                this.displayRecordings = this.recordings.split(",");
            }
            this.deployImageName = this.station.id + "_deploy.jpg";
            this.origLabel = this.station.deploy_image_label;
            this.origImageName = this.station.deploy_image_name;
            this.pathDest = path.join(folder.path, this.deployImageName);
            if (this.origImageName && this.origImageName.length > 0) {
                // load previously saved image
                this.pathDest = path.join(folder.path, this.origImageName);
                const imageFromLocalFile = fromFile(this.pathDest);
                this.imageSrc = imageFromLocalFile;
                this.labelText = this.origLabel;
                this.havePhoto = true;
            }
        },

        onAudioTap(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            dialogs
                .action({
                    message: _L("addAudio"),
                    cancelButtonText: _L("cancel"),
                    actions: [_L("startRecording")]
                })
                .then(result => {
                    if (result == _L("startRecording")) {
                        this.startAudioRecording();
                    }
                });
        },

        startAudioRecording() {
            // Create unique filename
            let now = new Date();
            let month = monthNames[now.getMonth()];
            let day = now.getDate();
            let year = now.getFullYear();
            let filename = _L("audioNote") + " " + month + " " + day + " " + year;
            // colons not allowed in audio file names - if time is needed, re-work this
            // let time = now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
            let dateIndex = month + "_" + day + "_" + year;
            if (this.newRecordings[dateIndex]) {
                // increment filename if we already have any
                let numRecordings = this.newRecordings[dateIndex].length;
                filename += " " + (numRecordings + 1);
            } else {
                this.newRecordings[dateIndex] = [];
            }
            this.newRecordings[dateIndex].push(filename);

            audioInterface.startRecording(filename);

            dialogs
                .action({
                    message: _L("recording"),
                    actions: [_L("stopRecording")]
                })
                .then(result => {
                    if (result == _L("stopRecording")) {
                        audioInterface.stopRecording();
                        // automatically save recording
                        this.addRecording(filename);
                    }
                });
        },

        addRecording(filename) {
            this.displayRecordings.push(filename);
            this.saveRecordings();
        },

        removeRecording(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            let filename = event.object.data;
            // confirm removal
            dialogs
                .confirm({
                    title: _L("confirmDeleteRecording"),
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel")
                })
                .then(result => {
                    if (result) {
                        let index = this.displayRecordings.indexOf(filename);
                        if (index == -1) {
                            return;
                        }
                        this.displayRecordings.splice(index, 1);
                        this.saveRecordings();
                        // delete file on phone
                        audioInterface.deleteRecordedFile(filename);
                    }
                });
        },

        saveRecordings() {
            this.station.deploy_audio_files = this.displayRecordings.join(",");
            dbInterface.setStationDeployAudio(this.station);
            let configChange = {
                station_id: this.station.id,
                before: this.origRecordings,
                after: this.station.deploy_audio_files,
                affected_field: "deploy_audio_files",
                author: this.userName
            };
            dbInterface.recordStationConfigChange(configChange);
            this.origRecordings = this.station.deploy_audio_files;
        },

        playAudio(event) {
            audioInterface.playRecordedFile(event.object.data);
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
                        // width: this.width,
                        // height: this.height,
                        keepAspectRatio: this.keepAspectRatio,
                        saveToGallery: this.saveToGallery,
                        allowsEditing: this.allowsEditing
                    }).then(
                        imageAsset => {
                            this.imageSrc = imageAsset;
                            this.savePicture();
                            this.havePhoto = true;
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
                    this.havePhoto = true;
                    // selection[0].options.width = this.width;
                    // selection[0].options.height = this.height;
                })
                .catch(e => {
                    // console.log(e);
                });
        },

        savePicture() {
            source.fromAsset(this.imageSrc).then(
                imageSource => {
                    let saved = imageSource.saveToFile(this.pathDest, "jpg");
                    if (saved) {
                        this.station.deploy_image_name = this.deployImageName;
                        dbInterface.setStationDeployImage(this.station);
                        let configChange = {
                            station_id: this.station.id,
                            before: this.origImageName,
                            after: this.deployImageName,
                            affected_field: "deploy_image_name",
                            author: this.userName
                        };
                        dbInterface.recordStationConfigChange(configChange);
                        this.origImageName = this.deployImageName;
                    }
                },
                error => {
                    // console.log("Error saving image", error);
                }
            );
        },

        saveLabel() {
            if (this.origLabel != this.labelText) {
                this.station.deploy_image_label = this.labelText;
                dbInterface.setStationDeployImageLabel(this.station);
                let configChange = {
                    station_id: this.station.id,
                    before: this.origLabel,
                    after: this.labelText,
                    affected_field: "deploy_image_label",
                    author: this.userName
                };
                dbInterface.recordStationConfigChange(configChange);
                this.origLabel = this.labelText;
            }
        },

        saveNote() {
            let textField = this.page.getViewById("note-text-field");
            if (!this.noteText || this.noteText == "" || this.noteText.length == 0) {
                // show full hint text
                textField.className = "size-18 full-height";
            } else {
                // let height auto-adjust
                textField.className = "size-18";
            }

            if (this.origNote != this.noteText) {
                this.station.deploy_note = this.noteText;
                dbInterface.setStationDeployNote(this.station);
                let configChange = {
                    station_id: this.station.id,
                    before: this.origNote,
                    after: this.noteText,
                    affected_field: "deploy_note",
                    author: this.userName
                };
                dbInterface.recordStationConfigChange(configChange);
                this.origNote = this.noteText;
            }
        },

        deployStation(event) {
            this.removeFocus("note-text-field");
            this.removeFocus("photo-label-input");
            // just in case?
            this.saveNote();
            this.saveLabel();
            event.object.text = _L("recording");

            queryStation.queryStartRecording(this.station.url).then(result => {
                // console.log("result of queryStartRecording", result)
            });

            // temporary? - update portal with deployment info
            if (this.station.portal_id && this.station.url != "no_url") {
                let params = {
                    name: this.station.name,
                    device_id: this.station.device_id,
                    status_json: this.station
                };
                this.$portalInterface
                    .updateStation(params, this.station.portal_id)
                    .then(stationPortalId => {
                        // console.log("successfully updated", stationPortalId)
                    });
            }
        },

        removeFocus(id) {
            let textField = this.page.getViewById(id);
            textField.dismissSoftInput();

            let hiddenField = this.page.getViewById("hidden-field");
            hiddenField.focus();
            hiddenField.dismissSoftInput();
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.round {
    width: 40;
    padding-bottom: 10;
    padding-top: 8;
    margin-top: 1;
    border-radius: 20;
}

.small-round {
    width: 40;
    padding: 2;
    border-radius: 20;
}

.col {
    padding-top: 10;
    padding-bottom: 10;
    border-width: 1;
    border-color: $fk-gray-lighter;
    background: $fk-gray-white;
}

.left-col {
    border-top-left-radius: 4;
    border-bottom-left-radius: 4;
}

.right-col {
    border-top-right-radius: 4;
    border-bottom-right-radius: 4;
}

.photo-label {
    width: 96%;
    padding: 0;
    font-size: 18;
}

#photo-label-input {
    width: 96%;
    border-bottom-width: 1;
    border-bottom-color: $fk-primary-black;
}

.link-style {
    color: $fk-primary-blue;
    margin-left: 20;
    margin-right: 10;
    margin-top: 5;
    margin-bottom: 10;
}

#note-text-field {
    border-bottom-width: 1;
    border-bottom-color: $fk-primary-black;
}

.full-height {
    height: 75;
}

#hidden-field {
    opacity: 0;
}
</style>
