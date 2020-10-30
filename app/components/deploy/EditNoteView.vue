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

import { ActionTypes, MutationTypes, Station, Notes, NoteData, NoteMedia, NoteHelp, NoteForm, UpdateNoteMutation } from "@/store";

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
            return this.$store.state.notes.stations[this.stationId];
        },
        currentStation(): Station {
            return this.$store.getters.legacyStations[this.stationId];
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

            this.$store.commit(new UpdateNoteMutation(this.stationId, this.editingKey, form));

            return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId }).then(() => {
                return this.$navigateBack({});
            });
        },
        onAttachNoteMedia(media: NoteMedia): Promise<any> {
            if (NoteMedia.isAudio(media)) {
                this.$store.commit(MutationTypes.ATTACH_NOTE_MEDIA, { stationId: this.stationId, key: this.editingKey, audio: media });
            } else {
                this.$store.commit(MutationTypes.ATTACH_NOTE_MEDIA, { stationId: this.stationId, key: this.editingKey, photo: media });
            }
            return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId });
        },
        onRemoveAudio(media: NoteMedia): Promise<any> {
            this.$store.commit(MutationTypes.REMOVE_NOTE_MEDIA, { stationId: this.stationId, key: this.editingKey, audio: media });
            return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId });
        },
        onCancelEditing(): Promise<any> {
            return this.$navigateBack({});
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
