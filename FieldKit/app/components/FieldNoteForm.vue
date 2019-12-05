<template>
    <StackLayout @loaded="onPageLoaded" @unloaded="onUnloaded">

        <GridLayout rows="auto" columns="15*,70*,15*" class="m-y-10 bottom-border">
            <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="onCancel">
                <Image width="21" src="~/images/Icon_Close.png"></Image>
            </StackLayout>
            <StackLayout col="1">
                <Label class="title m-t-10 text-center" :text="fieldNote.title" textWrap="true"></Label>
            </StackLayout>
            <StackLayout col="2" class="round-bkgd" @tap="onSave">
                <Image width="25" src="~/images/Icon_Save.png"></Image>
            </StackLayout>
        </GridLayout>

        <!-- List audio recordings -->
        <GridLayout
            rows="auto"
            columns="10*,80*,10*"
            v-for="(recording, index) in displayRecordings"
            :key="recording"
            class="link-style recording-box"
            orientation="vertical"
        >
            <Image
                col="0"
                width="20"
                class="small-round"
                :data="recording"
                src="~/images/play.png"
                @tap="playAudio"
            ></Image>
            <Label
                col="1"
                :text="fieldNote.title + ' audio note ' + (displayRecordings.length > 1 ? index+1 : '')"
                :data="recording"
                textWrap="true"
                @tap="playAudio"
            />
            <Image
                col="2"
                width="17"
                class="small-round"
                :data="recording"
                src="~/images/trash.png"
                @tap="removeRecording"
            ></Image>
        </GridLayout>
        <!-- end: List audio recordings -->

        <TextView
            textWrap="true"
            :class="'size-14 p-x-20 ' + (displayRecordings.length > 1 ? 'med-text-field' : 'large-text-field')"
            :hint="fieldNote.instruction"
            v-model="fieldNote.value"
            @blur="onSave"
        ></TextView>

        <Image
            width="40"
            src="~/images/mic_outlined.png"
            horizontalAlignment="right"
            class="m-10"
            @tap="onAudioTap"
        ></Image>

    </StackLayout>
</template>

<script>
import * as dialogs from "tns-core-modules/ui/dialogs";
import AudioInterface from "../services/audio-interface";

const audioInterface = new AudioInterface();

// note: global variable _L not defined here
// so month name abbreviations are set below
let monthNames = [];

export default {
    data() {
        return {
            newRecordings: {},
            displayRecordings: [],
        };
    },
    props: ["fieldNote"],
    methods: {
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

            if (this.fieldNote.audioFile) {
                this.displayRecordings = this.fieldNote.audioFile.split(",");
            }
        },

        onUnloaded() {
            this.$emit("saveEdit", this.fieldNote);
        },

        onCancel() {
            this.$emit("cancel");
        },

        onSave() {
            this.$emit("saveEdit", this.fieldNote);
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
            let filename =
                _L("audioNote") + " " + this.fieldNote.title + " " + month + " " + day + " " + year;
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

            audioInterface.startAudioRecording(filename);

            dialogs
                .action({
                    message: _L("recording"),
                    actions: [_L("stopRecording")]
                })
                .then(result => {
                    if (result == _L("stopRecording")) {
                        audioInterface.stopAudioRecording();
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
                        this.removeFromDatabase(filename);
                        // delete file on phone
                        audioInterface.deleteRecordedFile(filename);
                    }
                });
        },

        saveRecordings() {
            this.$emit("saveAudio", this.fieldNote, this.displayRecordings);
        },

        removeFromDatabase(filename) {
            this.$emit("removeAudio", this.fieldNote, filename);
        },

        playAudio(event) {
            audioInterface.playRecordedFile(event.object.data);
        },
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles

.bottom-border {
    padding-bottom: 20;
    margin-bottom: 40;
    border-bottom-width: 1;
    border-color: $fk-gray-lighter;
}
.med-text-field {
    height: 100;
    border-width: 1;
    border-color: white;
}
.large-text-field {
    height: 300;
    border-width: 1;
    border-color: white;
}

.recording-box {
    padding: 10;
    margin: 10;
    border-width: 1;
    border-color: $fk-gray-lighter;
}
.link-style {
    color: $fk-primary-blue;
}

</style>
