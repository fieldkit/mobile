<template>
    <StackLayout class="recordings">
        <StackLayout v-for="r in recordings" :key="r.id" class="recording-row">
            <GridLayout rows="auto" columns="10*,80*,10*" class="link-style recording-box">
                <Image
                    col="0"
                    width="20"
                    class="small-round"
                    src="~/images/Icon_Play.png"
                    v-if="playing != r"
                    @tap="(ev) => startPlaying(ev, r)"
                />
                <Image
                    col="0"
                    width="20"
                    class="small-round"
                    src="~/images/Icon_Stop.png"
                    v-if="playing == r"
                    @tap="(ev) => stopPlaying(ev, r)"
                />
                <Label col="1" :text="getFileName(r)" :data="getFileName(r)" textWrap="true" @tap="(ev) => toggleAudio(ev, r)" />
                <Image col="2" width="20" class="small-round" src="~/images/Icon_Delete.png" @tap="(ev) => removeRecording(ev, r)" />
            </GridLayout>
        </StackLayout>
    </StackLayout>
</template>
<script lang="ts">
import Vue from "vue";
import { NoteMedia } from "@/store";

export default Vue.extend({
    props: {
        recordings: {
            type: Array,
            required: true,
        },
    },
    data(): { playing: NoteMedia | null } {
        return {
            playing: null,
        };
    },
    methods: {
        getFileName(this: any, media: NoteMedia) {
            const parts = media.path.split("/");
            return parts[parts.length - 1];
        },
        toggleAudio(this: any, ev, media: NoteMedia) {
            if (this.playing) {
                return this.stopPlaying(media);
            }
            return this.startPlaying(media);
        },
        startPlaying(this: any, media: NoteMedia) {
            console.log("recording:playing");
            return this.$services
                .Audio()
                .playRecordedFile(media.path, ({ error }) => {
                    console.log("recording:playback:done", error);
                    this.playing = null;
                })
                .then(() => {
                    this.playing = media;
                })
                .catch((err) => {
                    console.log("audio:play:error", err);
                });
        },
        stopPlaying(this: any, media: NoteMedia) {
            if (this.playing === null) {
                return Promise.resolve();
            }
            return this.$services
                .Audio()
                .stopPlayer()
                .then(() => {
                    this.playing = null;
                })
                .catch((err) => {
                    console.log("audio:stop:error", err);
                });
        },
        removeRecording(this: any, ev, media: NoteMedia) {
            console.log("recording:remove", media);
            return this.stopPlaying().then(() => {
                return this.$emit("remove-audio", media);
            });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.recording-row {
    padding-top: 10;
}
.recording-box {
    padding: 10;
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
}
.link-style {
    color: $fk-primary-blue;
}
/*
.small-round {
    width: 40;
    padding: 2;
    border-radius: 20;
}
*/
</style>
