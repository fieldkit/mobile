<template>
    <GridLayout rows="auto,*,auto" height="100%" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout row="0" rows="auto" columns="15*,70*,15*" class="container-header">
            <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="onCancel">
                <Image width="21" src="~/images/Icon_Close.png"></Image>
            </StackLayout>
            <StackLayout col="1" verticalAlignment="middle">
                <Label class="title text-center" :text="help.title" textWrap="true"></Label>
            </StackLayout>
            <StackLayout col="2" class="round-bkgd" @tap="onSave">
                <Image width="25" src="~/images/Icon_Save.png"></Image>
            </StackLayout>
        </GridLayout>

        <ScrollView row="1">
            <GridLayout rows="auto,*,auto" v-if="!note.image" class="container">
                <Label :text="help.instructions" row="0" class="m-x-20 m-y-10 size-12" textWrap="true" width="100%" />
                <TextView
                    ref="noteBody"
                    row="1"
                    textWrap="true"
                    width="100%"
                    class="large-text-field"
                    :hint="help.instructions"
                    v-model="form.body"
                />
                <StackLayout row="2" width="100%" class="audio-container">
                    <AudioRecordings :recordings="note.audio" @remove-audio="raiseRemoveAudio" />
                    <MakeAudioRecording v-if="audioReady" @cancel="onAudioTap" @stop="onAudioDone" />
                </StackLayout>
            </GridLayout>
        </ScrollView>

        <DockLayout row="2" @tap="maybeDismissKeyboard" class="bottom-container" width="100%" stretchLastChild="false">
            <Label :text="new Date() | prettyTime" dock="left" class="m-t-15 m-l-10 m-b-10 size-14 lighter" />
            <Image width="40" src="~/images/Icon_Mic_Button.png" dock="right" v-if="!note.image" @tap="onAudioTap" />
        </DockLayout>
    </GridLayout>
</template>

<script>
import * as dialogs from "tns-core-modules/ui/dialogs";
import { AnimationCurve } from "tns-core-modules/ui/enums";
import { NoteMedia, NoteForm } from "../../store/modules/notes";

import LabeledTextView from "../LabeledTextView";
import MakeAudioRecording from "./MakeAudioRecording";
import AudioRecordings from "./AudioRecordings";

export default {
    components: {
        LabeledTextView,
        MakeAudioRecording,
        AudioRecordings,
    },
    props: {
        note: {
            type: Object,
            required: true,
        },
        help: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            audioReady: false,
            form: {
                body: this.note.body || "",
            },
        };
    },
    methods: {
        onPageLoaded(args) {},
        onUnloaded() {},
        onCancel() {
            console.log("note cancel", this.form);
            this.$emit("cancel");
        },
        onSave() {
            console.log("note save", this.form);
            this.$emit("save", { form: this.form });
        },
        onAudioTap(ev) {
            this.audioReady = !this.audioReady;
        },
        onAudioDone(...args) {
            this.$emit("attach-media", ...args);
        },
        raiseRemoveAudio(...args) {
            this.$emit("remove-audio", ...args);
        },
        maybeDismissKeyboard() {
            this.$refs.noteBody.nativeView.dismissSoftInput();
        },
    },
};
</script>

<style scoped lang="scss">
@import "../../app-variables";

.field-label {
    color: $fk-gray-hint;
    font-size: 18;
}
.link-style {
    color: $fk-primary-blue;
}
.lighter {
    color: $fk-gray-text;
}
.field-label,
labeled-text-field {
}
.container-header {
    margin-bottom: 10;
}
.container {
    padding: 15;
    height: 100%;
    /* background-color: #aafafa; */
}
.large-text-field {
    border-width: 2;
    border-color: #d8dce0;
    placeholder-color: $fk-gray-hint;
    /* background-color: #ffaaff; */
}
.bottom-container {
    border-top: 1px solid #d8dce0;
    /* background-color: #afaaff; */
}

.audio-container {
}
</style>
