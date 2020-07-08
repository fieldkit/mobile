<template>
    <GridLayout rows="auto,*,auto" height="100%" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout row="0" rows="auto" columns="15*,70*,15*" class="container-header">
            <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="onCancel">
                <Image width="21" src="~/images/Icon_Close.png"></Image>
            </StackLayout>
            <StackLayout col="1" verticalAlignment="middle">
                <Label class="title text-center" :text="note.help.title" textWrap="true"></Label>
            </StackLayout>
            <StackLayout col="2" class="round-bkgd" @tap="onSave">
                <Image width="25" src="~/images/Icon_Save.png"></Image>
            </StackLayout>
        </GridLayout>

        <ScrollView row="1">
            <WrapLayout orientation="horizontal" v-if="!note.image" class="container">
                <Label :text="note.help.instructions" class="m-x-20 m-y-10 size-12" textWrap="true" width="100%" />
                <TextView textWrap="true" width="100%" class="size-14 p-x-20 large-text-field" :hint="note.help.instructions" v-model="form.body"></TextView>

                <AudioRecordings :recordings="note.audio" @remove-audio="raiseRemoveAudio" />

                <MakeAudioRecording v-if="audioReady" @cancel="onAudioTap" @stop="onAudioDone" />
            </WrapLayout>
            <GridLayout row="1" rows="auto,auto,auto" columns="*" v-if="note.image" class="container">
                <TextView row="1" class="labeled-text-field input" v-model="form.body" autocorrect="false" autocapitalizationType="none" :hint="note.help.instructions" />
                <Image row="2" height="300" :src="note.image" stretch="aspectFit" />
            </GridLayout>
        </ScrollView>

        <Label row="2" :text="new Date() | prettyTime" horizontalAlignment="left" class="m-t-15 m-l-10 m-b-10 size-14 lighter"></Label>
        <Image row="2" width="40" src="~/images/Icon_Mic_Button.png" horizontalAlignment="right" class="m-10" v-if="!note.image" @tap="onAudioTap" />
    </GridLayout>
</template>

<script>
import * as dialogs from "tns-core-modules/ui/dialogs";
import { AnimationCurve } from "tns-core-modules/ui/enums";
import { NoteMedia, NoteForm } from "../store/modules/notes";

import LabeledTextView from "./LabeledTextView";
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
            this.$emit("cancel");
        },
        onSave() {
            this.$emit("save", { form: this.form });
        },
        onAudioTap(ev) {
            this.audioReady = !this.audioReady;
        },
        onAudioDone(...args) {
            this.$emit("attach-media", this.note, ...args);
        },
        raiseRemoveAudio(...args) {
            this.$emit("remove-audio", this.note, ...args);
        },
    },
};
</script>

<style scoped lang="scss">
@import "../app-variables";

.bottom-border {
    margin-bottom: 40;
}
.bottom-border,
.bottom-border-no-margin {
    padding-bottom: 10;
    border-bottom-width: 1;
    border-color: $fk-gray-lighter;
    margin-top: 5;
}
.field-label {
    color: $fk-gray-hint;
    font-size: 18;
}
.labeled-text-field {
    color: $fk-primary-black;
    width: 100%;
    font-size: 18;
    border-width: 1;
    border-radius: 4;
    placeholder-color: $fk-gray-hint;
    border-color: #3f3f3f;
    height: 100;
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
}
.large-text-field {
    border-width: 1;
    border-color: white;
    placeholder-color: $fk-gray-hint;
}
</style>
