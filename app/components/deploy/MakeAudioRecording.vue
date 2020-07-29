<template>
    <GridLayout rows="auto" columns="10*,10*,70*,10*" class="recording-box">
        <Image
            col="0"
            width="20"
            class="small-round"
            src="~/images/Icon_Record.png"
            v-if="!recording || recording.paused"
            @tap="startOrResume()"
        />
        <Image
            col="0"
            width="20"
            class="small-round"
            src="~/images/Icon_Pause.png"
            v-if="recording && !recording.paused"
            @tap="pause"
        ></Image>
        <Image col="1" width="20" class="small-round" src="~/images/Icon_Stop.png" v-if="recording" @tap="stop"></Image>
        <Label col="2" :colSpan="recording ? 1 : 2" :text="recording.duration | prettyDuration" textWrap="true" v-if="recording" />
        <Label col="2" colSpan="2" :text="'Press record to begin.'" textWrap="true" v-if="!recording" />
        <Image col="3" width="20" class="small-round" src="~/images/Icon_Close_Circle.png" @tap="cancel"></Image>
    </GridLayout>
</template>

<script lang="ts">
import Vue from "vue";
import * as ActionTypes from "@/store/actions";

export default Vue.extend({
    data() {
        return {};
    },
    props: {},
    computed: {
        recording(this: any) {
            return this.$store.state.media.recording;
        },
    },
    methods: {
        onPageLoaded(args) {},
        onUnloaded() {},
        startOrResume(this: any) {
            if (this.recording) {
                return this.$store.dispatch(ActionTypes.AUDIO_RESUME);
            }
            return this.$store.dispatch(ActionTypes.AUDIO_RECORD);
        },
        pause(this: any) {
            return this.$store.dispatch(ActionTypes.AUDIO_PAUSE);
        },
        stop(this: any) {
            return this.$store.dispatch(ActionTypes.AUDIO_STOP).then((recording) => {
                return this.$emit("stop", recording);
            });
        },
        cancel(this: any) {
            if (this.$store.state.media.recording) {
                return this.$store.dispatch(ActionTypes.AUDIO_STOP).then(() => {
                    return this.$emit("cancel");
                });
            }
            return this.$emit("cancel");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.large-text-field {
    border-width: 1;
    border-color: white;
    placeholder-color: $fk-gray-hint;
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
.lighter {
    color: $fk-gray-text;
}
</style>
