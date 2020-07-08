<template>
    <StackLayout>
        <GridLayout rows="auto" columns="10*,80*,10*" v-for="r in recordings" :key="r.id" class="link-style recording-box">
            <Image col="0" width="20" class="small-round" :data="recording" src="~/images/Icon_Play.png" v-if="isPlaying != recording" @tap="playAudio" />
            <Image col="0" width="20" class="small-round" :data="recording" src="~/images/Icon_Stop.png" v-if="isPlaying == recording" @tap="stopPlaying" />
            <Label col="1" :text="recording" :data="recording" textWrap="true" @tap="playAudio" />
            <Image col="2" width="20" class="small-round" :data="recording" src="~/images/Icon_Delete.png" @tap="removeRecording" />
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
        return {};
    },
    methods: {
        playAudio() {},
        stopPlaying() {},
        removeRecording() {},
    },
};
</script>
<style scoped lang="scss">
@import "../app-variables";

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
