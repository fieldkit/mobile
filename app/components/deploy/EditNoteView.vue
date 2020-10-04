<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
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
import * as MutationTypes from "@/store/mutations";
import * as ActionTypes from "@/store/actions";

import { NoteData, NoteMedia } from "@/store/modules/notes";

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
    data() {
        return {};
    },
    computed: {
        notes(this: any) {
            return this.$store.state.notes.stations[this.stationId];
        },
        currentStation(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
        note(this: any) {
            if (this.editingKey) {
                console.log("data", this.editingKey, this.notes);
                return this.notes.notes[this.editingKey] || new NoteData();
            }
            return null;
        },
        help(this: any) {
            if (this.editingKey) {
                console.log("help", this.editingKey, this.notes);
                return this.notes.help[this.editingKey];
            }
            return null;
        },
    },
    methods: {
        onPageLoaded(this: any, args) {},
        onSaveNote(this: any, { form }) {
            console.log("saving", this.editingKey, form);

            this.$store.commit(MutationTypes.UPDATE_NOTE, { stationId: this.stationId, key: this.editingKey, update: form });

            return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId }).then(() => {
                return this.$navigateBack();
            });
        },
        onAttachNoteMedia(this: any, media) {
            if (NoteMedia.isAudio(media)) {
                this.$store.commit(MutationTypes.ATTACH_NOTE_MEDIA, { stationId: this.stationId, key: this.editingKey, audio: media });
            } else {
                this.$store.commit(MutationTypes.ATTACH_NOTE_MEDIA, { stationId: this.stationId, key: this.editingKey, photo: media });
            }
            return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId });
        },
        onRemoveAudio(this: any, media) {
            this.$store.commit(MutationTypes.REMOVE_NOTE_MEDIA, { stationId: this.stationId, key: this.editingKey, audio: media });
            return this.$store.dispatch(ActionTypes.SAVE_NOTES, { stationId: this.stationId });
        },
        onCancelEditing(this: any) {
            return this.$navigateBack();
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
