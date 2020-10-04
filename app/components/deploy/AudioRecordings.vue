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
export default Vue.extend({
    props: {
        recordings: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            playing: null,
        };
    },
    methods: {
        getFileName(this: any, media) {
            const parts = media.path.split("/");
            return parts[parts.length - 1];
        },
        toggleAudio(this: any, ev, media) {
            if (this.playing) {
                return this.stopPlaying(media);
            }
            return this.startPlaying(media);
        },
        startPlaying(this: any, media) {
            return this.$services
                .Audio()
                .playRecordedFile(media.path, () => {
                    this.playing = null;
                })
                .then(() => {
                    this.playing = media;
                });
        },
        stopPlaying(this: any, media) {
            if (this.playing === null) {
                return Promise.resolve();
            }
            return this.$services
                .Audio()
                .stopPlayer()
                .then(() => {
                    this.playing = null;
                });
        },
        removeRecording(this: any, ev, media) {
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
