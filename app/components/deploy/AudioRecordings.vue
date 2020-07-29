<template>
    <StackLayout>
        <GridLayout rows="auto" columns="10*,80*,10*" v-for="r in recordings" :key="r.id" class="link-style recording-box">
            <Image col="0" width="20" class="small-round" src="~/images/Icon_Play.png" v-if="playing != r" @tap="ev => playAudio(ev, r)" />
            <Image col="0" width="20" class="small-round" src="~/images/Icon_Stop.png" v-if="playing == r" @tap="ev => stopPlaying(ev, r)" />
            <Label col="1" :text="getFileName(r)" :data="getFileName(r)" textWrap="true" @tap="playAudio" />
            <Image col="2" width="20" class="small-round" src="~/images/Icon_Delete.png" @tap="ev => removeRecording(ev, r)" />
        </GridLayout>
    </StackLayout>
</template>
<script>
export default {
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
        getFileName(media) {
            const parts = media.path.split("/");
            return parts[parts.length - 1];
        },
        playAudio(ev, media) {
            return this.$services.Audio().playRecordedFile(media.path);
        },
        stopPlaying(media) {
            return this.$services.Audio().pausePlayer();
        },
        removeRecording(ev, media) {
            return this.$emit("remove-audio", media);
        },
    },
};
</script>
<style scoped lang="scss">
@import "~/_app-variables";

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
</style>
