<template>
    <Page class="page plain">
        <PlatformHeader
            :title="help.title"
            icon="~/images/Icon_Save.png"
            :canNavigateSettings="false"
            :canSave="true"
            @icon-tapped="onSave"
        />
        <GridLayout rows="*,auto" class="grid-container">
            <ScrollView row="0">
                <GridLayout rows="auto,*,auto" height="95%" v-if="!note.image" class="container">
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
                        <AudioRecordings :recordings="note.audio" @remove-audio="onRemoveAudio" />
                        <MakeAudioRecording v-if="audioReady" @cancel="onAudioTap" @stop="onAttachNoteMedia" />
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <DockLayout row="1" @tap="maybeDismissKeyboard" class="container" stretchLastChild="false">
                <Label :text="new Date() | prettyTime" dock="left" class="m-t-15 m-l-10 m-b-10 size-14 lighter" />
                <Image width="40" src="~/images/Icon_Mic_Button.png" dock="right" v-if="!note.image" @tap="onAudioTap" />
            </DockLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";

import SharedComponents from "@/components/shared";
import LabeledTextView from "../LabeledTextView.vue";
import MakeAudioRecording from "./MakeAudioRecording.vue";
import AudioRecordings from "./AudioRecordings.vue";

import {
    Station,
    Notes,
    NoteData,
    NoteMedia,
    NoteHelp,
    SaveNotesAction,
    UpdateNoteMutation,
    RemoveNoteMediaMutation,
    AttachNoteMediaMutation,
} from "@/store";

export default Vue.extend({
    components: {
        ...SharedComponents,
        LabeledTextView,
        MakeAudioRecording,
        AudioRecordings,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        editingKey: {
            type: String,
            required: true,
        },
    },
    data(): { audioReady: boolean; form: { body: string } } {
        const notes = this.$s.state.notes.stations[this.stationId];
        const existing = notes[this.editingKey] || new NoteData();
        return {
            audioReady: false,
            form: {
                body: existing.body || "",
            },
        };
    },
    computed: {
        notes(): Notes {
            return this.$s.state.notes.stations[this.stationId];
        },
        currentStation(): Station {
            return this.$s.getters.legacyStations[this.stationId];
        },
        note(): NoteData | null {
            if (this.editingKey) {
                return this.notes.notes[this.editingKey] || new NoteData();
            }
            return null;
        },
        help(): NoteHelp | null {
            if (this.editingKey) {
                return this.notes.help[this.editingKey];
            }
            return null;
        },
    },
    methods: {
        async onSave(): Promise<void> {
            console.log("notes-view:saving", this.editingKey, this.form);
            this.$s.commit(new UpdateNoteMutation(this.stationId, this.editingKey, this.form));
            await this.$s.dispatch(new SaveNotesAction(this.stationId)).then(() => {
                return this.$navigateBack({});
            });
        },
        async onAttachNoteMedia(media: NoteMedia): Promise<void> {
            if (NoteMedia.isAudio(media)) {
                this.$s.commit(new AttachNoteMediaMutation(this.stationId, this.editingKey, media, true));
            } else {
                this.$s.commit(new AttachNoteMediaMutation(this.stationId, this.editingKey, media, false));
            }
            await this.$s.dispatch(new SaveNotesAction(this.stationId));
        },
        async onRemoveAudio(media: NoteMedia): Promise<void> {
            this.$s.commit(new RemoveNoteMediaMutation(this.stationId, this.editingKey, media));
            await this.$s.dispatch(new SaveNotesAction(this.stationId));
        },
        async onCancelEditing(): Promise<void> {
            await this.$navigateBack();
        },
        onAudioTap(): void {
            this.audioReady = !this.audioReady;
        },
        maybeDismissKeyboard(): void {
            (this.$refs.noteBody as any).nativeView.dismissSoftInput();
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.container {
    margin: 5;
}
</style>
