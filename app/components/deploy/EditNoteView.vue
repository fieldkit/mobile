<template>
    <Page class="page plain" actionBarHidden="true">
        <GridLayout rows="*">
            <FieldNoteForm
                :help="help"
                :note="note"
                @save="onSaveNote"
                @cancel="onCancelEditing"
                @attach-media="onAttachNoteMedia"
                @remove-audio="onRemoveAudio"
            />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";

import SharedComponents from "@/components/shared";
import FieldNoteForm from "./FieldNoteForm.vue";

import {
    Station,
    Notes,
    NoteData,
    NoteMedia,
    NoteHelp,
    NoteForm,
    SaveNotesAction,
    UpdateNoteMutation,
    RemoveNoteMediaMutation,
    AttachNoteMediaMutation,
} from "@/store";

export default Vue.extend({
    components: {
        ...SharedComponents,
        FieldNoteForm,
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
    data(): {} {
        return {};
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
        onSaveNote(form: NoteForm): Promise<any> {
            console.log("notes-view:saving", this.editingKey, form);
            this.$s.commit(new UpdateNoteMutation(this.stationId, this.editingKey, form));
            return this.$s.dispatch(new SaveNotesAction(this.stationId)).then(() => {
                return this.$navigateBack({});
            });
        },
        onAttachNoteMedia(media: NoteMedia): Promise<any> {
            if (NoteMedia.isAudio(media)) {
                this.$s.commit(new AttachNoteMediaMutation(this.stationId, this.editingKey, media, true));
            } else {
                this.$s.commit(new AttachNoteMediaMutation(this.stationId, this.editingKey, media, false));
            }
            return this.$s.dispatch(new SaveNotesAction(this.stationId));
        },
        onRemoveAudio(media: NoteMedia): Promise<any> {
            this.$s.commit(new RemoveNoteMediaMutation(this.stationId, this.editingKey, media));
            return this.$s.dispatch(new SaveNotesAction(this.stationId));
        },
        async onCancelEditing(): Promise<void> {
            await this.$navigateBack();
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
