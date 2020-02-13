<template>
    <GridLayout
        rows="auto,*,auto"
        height="100%"
        @loaded="onPageLoaded"
        @unloaded="onUnloaded"
    >
        <!-- header section -->
        <GridLayout
            row="0"
            rows="auto"
            columns="15*,70*,15*"
            :class="fieldNote.image
                ? 'bottom-border-no-margin'
                : 'bottom-border'"
        >
            <StackLayout
                col="0"
                class="round-bkgd"
                verticalAlignment="top"
                @tap="onCancel"
            >
                <Image width="21" src="~/images/Icon_Close.png"></Image>
            </StackLayout>
            <StackLayout col="1" verticalAlignment="middle">
                <Label
                    class="title text-center"
                    :text="fieldNote.title"
                    textWrap="true"
                ></Label>
            </StackLayout>
            <StackLayout col="2" class="round-bkgd" @tap="onSave">
                <Image width="25" src="~/images/Icon_Save.png"></Image>
            </StackLayout>
        </GridLayout>

        <!-- display photo section -->
        <GridLayout row="1" v-if="fieldNote.image" rows="auto,auto,auto" columns="*">
            <Label
                row="0"
                id="photo-text-instruction"
                :text="fieldNote.instruction"
                class="m-x-20 m-t-10 size-12"
                textWrap="true"
                :visibility="typing ? 'visible' : 'collapsed'"
            />
            <TextView
                row="1"
                textWrap="true"
                class="size-14 p-x-20 m-y-10 large-text-field"
                :hint="fieldNote.instruction"
                v-model="fieldNote.value"
                @textChange="showAndroidPhotoInstruction"
                @focus="showIosPhotoInstruction"
            ></TextView>
            <Image
                row="2"
                height="300"
                :src="fieldNote.image"
                stretch="aspectFit"
            />
        </GridLayout>

        <WrapLayout
            row="1"
            orientation="horizontal"
            v-if="!fieldNote.image"
        >
            <!-- title option for additional notes -->
            <GridLayout
                rows="auto,auto,auto"
                columns="*"
                class="m-b-2"
                v-if="fieldNote.field == 'additional'"
            >
                <Label
                    row="0"
                    text="Title"
                    class="m-x-20 m-b-2 size-14"
                />
                <TextView
                    row="1"
                    class="size-14 p-x-20 large-text-field"
                    hint="Tap to add a title"
                    v-model="fieldNote.title"
                ></TextView>
                <Label
                    row="2"
                    text="Note"
                    class="m-x-20 m-t-10 size-14"
                />
            </GridLayout>
            <!-- main text input section -->
            <Label
                id="main-text-instruction"
                :text="fieldNote.instruction"
                class="m-x-20 m-y-10 size-12"
                textWrap="true"
                width="100%"
                :visibility="fieldNote.field != 'additional' && typing ? 'visible' : 'collapsed'"
            />
            <TextView
                textWrap="true"
                width="100%"
                class="size-14 p-x-20 large-text-field"
                :hint="fieldNote.instruction"
                v-model="fieldNote.value"
                @textChange="showAndroidMainInstruction"
                @focus="showIosMainInstruction"
                @blur="stopTyping"
            ></TextView>

            <!-- Recording in progress -->
            <GridLayout
                rows="auto"
                columns="10*,10*,70*,10*"
                class="recording-box"
                v-if="preRecord || recordingInProgress"
            >
                <Image
                    col="0"
                    width="20"
                    class="small-round"
                    src="~/images/Icon_Pause.png"
                    v-if="recordingInProgress"
                    @tap="pauseRecording"
                ></Image>
                <Image
                    col="0"
                    width="20"
                    class="small-round"
                    src="~/images/Icon_Record.png"
                    v-if="preRecord"
                    automationText="startRecording"
                    @tap="
                        recordingInProgress
                            ? resumeRecording()
                            : startAudioRecording()
                    "
                ></Image>
                <Image
                    col="1"
                    width="20"
                    class="small-round"
                    src="~/images/Icon_Stop.png"
                    v-if="recordingInProgress"
                    automationText="stopRecording"
                    @tap="stopRecording"
                ></Image>
                <Label
                    col="2"
                    :colSpan="recordingInProgress ? 1 : 2"
                    :text="recordingTime"
                    textWrap="true"
                />
                <Image
                    col="3"
                    width="20"
                    class="small-round"
                    src="~/images/Icon_Close_Circle.png"
                    @tap="cancelRecording"
                ></Image>
            </GridLayout>
            <!-- end recording in progress -->

            <!-- List audio recordings -->
            <GridLayout
                rows="auto"
                columns="10*,80*,10*"
                v-for="(recording, index) in displayRecordings"
                :key="recording"
                class="link-style recording-box"
            >
                <Image
                    col="0"
                    width="20"
                    class="small-round"
                    :data="recording"
                    src="~/images/Icon_Play.png"
                    v-if="isPlaying != recording"
                    @tap="playAudio"
                ></Image>
                <Image
                    col="0"
                    width="20"
                    class="small-round"
                    :data="recording"
                    src="~/images/Icon_Stop.png"
                    v-if="isPlaying == recording"
                    @tap="stopPlaying"
                ></Image>
                <Label
                    col="1"
                    :text="recording"
                    :data="recording"
                    textWrap="true"
                    :automationText="'audioRecording' + index"
                    @tap="playAudio"
                />
                <Image
                    col="2"
                    width="20"
                    class="small-round"
                    :data="recording"
                    src="~/images/Icon_Delete.png"
                    @tap="removeRecording"
                ></Image>
            </GridLayout>
            <!-- end: List audio recordings -->
        </WrapLayout>

        <!-- date and time -->
        <Label
            row="2"
            :text="currentTime"
            horizontalAlignment="left"
            class="m-t-15 m-l-10 m-b-10 size-14 lighter"
        ></Label>

        <!-- mic icon -->
        <Image
            row="2"
            width="40"
            src="~/images/Icon_Mic_Button.png"
            horizontalAlignment="right"
            class="m-10"
            automationText="addAudioNote"
            v-if="!fieldNote.image"
            @tap="onAudioTap"
        ></Image>
    </GridLayout>
</template>

<script>
import * as dialogs from "tns-core-modules/ui/dialogs";
import { AnimationCurve } from "tns-core-modules/ui/enums";
import { isIOS } from "tns-core-modules/platform";
import AudioInterface from "../services/audio-interface";
import { getFormattedTime } from "../utilities";

const audioInterface = new AudioInterface();

// note: global variable _L not defined here
// so month name abbreviations are set below
let monthNames = [];

export default {
    data() {
        return {
            typing: false,
            displayRecordings: [],
            isPlaying: false,
            preRecord: false,
            timer: 0,
            recordingTime: "00:00:00",
            recordingInProgress: false,
            currentTime: ""
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
            this.currentTime = this.getTimestamp();

            this.photoInstruction = this.page.getViewById("photo-text-instruction");
            this.mainInstruction = this.page.getViewById("main-text-instruction");

            if (this.fieldNote.audioFile) {
                this.displayRecordings = this.fieldNote.audioFile.split(",");
            }
        },

        onUnloaded() {
            // if (this.fieldNote.field == "additional") {
            //     this.$emit("saveAdditional", this.fieldNote);
            // } else {
            //     this.$emit("saveEdit", this.fieldNote);
            // }
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
        },

        onCancel() {
            this.$emit("cancel");
        },

        onSave() {
            this.$emit("saveEdit", this.fieldNote);
        },

        stopTyping() {
            this.typing = false;
        },

        showIosMainInstruction() {
            if (isIOS) {
                this.showInstruction(this.mainInstruction);
            }
        },

        showAndroidMainInstruction() {
            if (!isIOS && !this.typing) {
                this.showInstruction(this.mainInstruction);
            } else if (!isIOS && !this.fieldNote.value) {
                this.typing = false;
            }
        },

        showIosPhotoInstruction() {
            if (isIOS) {
                this.showInstruction(this.photoInstruction);
            }
        },

        showAndroidPhotoInstruction() {
            if (!isIOS && !this.typing) {
                this.showInstruction(this.photoInstruction);
            } else if (!isIOS && !this.fieldNote.value) {
                this.typing = false;
            }
        },

        showInstruction(element) {
            element.opacity = 0;
            element.translateX = 5;
            element.translateY = 20;
            this.typing = true;
            element
                .animate({
                    opacity: 0.75,
                    translate: { x: 0, y: 0},
                    duration: 300,
                    curve: AnimationCurve.easeIn
                });
        },

        getTimestamp() {
            let now = new Date();
            let month = monthNames[now.getMonth()];
            let day = now.getDate();
            let year = now.getFullYear();
            let time = getFormattedTime(now);
            return month + " " + day + ", " + year + " | " + time;
        },

        onAudioTap(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.preRecord = true;
        },

        startAudioRecording() {
            // Create unique filename
            let now = new Date();
            let month = monthNames[now.getMonth()];
            let day = now.getDate();
            let year = now.getFullYear();
            let filename =
                this.fieldNote.title +
                " " + _L("audioNote") + " " +
                month +
                " " +
                day +
                " " +
                year;
            let index = 2;
            while (this.displayRecordings.indexOf(filename) > -1) {
                filename = filename + " " + index;
                index += 1;
            }
            audioInterface.startAudioRecording(filename);
            this.preRecord = false;
            this.recordingInProgress = filename;
            this.timer = 0;
            this.timerInterval = setInterval(this.tickRecordingTimer, 1000);
        },

        pauseRecording() {
            this.preRecord = true;
            audioInterface.pauseAudioRecording();
            clearInterval(this.timerInterval);
        },

        resumeRecording() {
            this.preRecord = false;
            audioInterface.resumeAudioRecording();
            this.timerInterval = setInterval(this.tickRecordingTimer, 1000);
        },

        stopRecording() {
            audioInterface.stopAudioRecording();
            const recording = this.recordingInProgress;
            this.displayRecordings.push(recording);
            // automatically save recording
            this.saveRecording(recording);
            this.recordingTime = "00:00:00";
            this.timer = 0;
            this.preRecord = false;
            this.recordingInProgress = false;
            clearInterval(this.timerInterval);
        },

        cancelRecording() {
            audioInterface.stopAudioRecording();
            this.recordingTime = "00:00:00";
            this.timer = 0;
            this.preRecord = false;
            this.recordingInProgress = false;
            clearInterval(this.timerInterval);
        },

        tickRecordingTimer() {
            this.timer += 1;
            const origSeconds = this.timer;
            let seconds = Math.floor(origSeconds % 60);
            seconds = seconds < 10 ? "0" + seconds : seconds;
            let minutes = Math.floor((origSeconds / 60) % 60);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            let hours = Math.floor((origSeconds / (60 * 60)) % 24);
            hours = hours < 10 ? "0" + hours : hours;
            this.recordingTime = hours + ":" + minutes + ":" + seconds;
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
                        this.fieldNote.audioFile = this.displayRecordings.join(",");
                        this.removeFromDatabase(filename);
                        // delete file on phone
                        audioInterface.deleteRecordedFile(filename);
                    }
                });
        },

        saveRecording(recording) {
            if (this.fieldNote.field == "additional") {
                this.fieldNote.audioFile = this.displayRecordings.join(",");
            } else {
                this.$emit("saveAudio", this.fieldNote, recording);
            }
        },

        removeFromDatabase(filename) {
            this.$emit("removeAudio", this.fieldNote, filename);
        },

        playAudio(event) {
            this.isPlaying = event.object.data;
            audioInterface.playRecordedFile(event.object.data, () => {
                this.isPlaying = false;
            });
        },

        stopPlaying(event) {
            this.isPlaying = false;
            audioInterface.pausePlayer();
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles

.bottom-border {
    margin-bottom: 40;
}
.bottom-border,
.bottom-border-no-margin {
    padding-bottom: 10;
    margin-top: 5;
    border-bottom-width: 1;
    border-color: $fk-gray-lighter;
}
.large-text-field {
    border-width: 1;
    border-color: white;
    placeholder-color: $fk-gray-hint;
}

.recording-box {
    padding: 10;
    margin: 10;
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
}
.link-style {
    color: $fk-primary-blue;
}
.lighter {
    color: $fk-gray-text;
}
</style>
