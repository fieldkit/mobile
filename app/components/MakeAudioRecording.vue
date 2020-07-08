<template>
    <GridLayout rows="auto" columns="10*,10*,70*,10*" class="recording-box">
        <Image col="0" width="20" class="small-round" src="~/images/Icon_Record.png" v-if="!recording || recording.paused" @tap="startOrResume()" />
        <Image col="0" width="20" class="small-round" src="~/images/Icon_Pause.png" v-if="recording && !recording.paused" @tap="pause"></Image>
        <Image col="1" width="20" class="small-round" src="~/images/Icon_Stop.png" v-if="recording" @tap="stop"></Image>
        <Label col="2" :colSpan="recording ? 1 : 2" :text="recording.duration | prettyDuration" textWrap="true" v-if="recording" />
        <Label col="2" colSpan="2" :text="'Press record to begin.'" textWrap="true" v-if="!recording" />
        <Image col="3" width="20" class="small-round" src="~/images/Icon_Close_Circle.png" @tap="cancel"></Image>
    </GridLayout>
</template>

<script>
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as ActionTypes from "../store/actions";
import { ActiveRecording } from "../store/modules/media";

export default {
    data() {
        return {};
    },
    props: {},
    computed: {
        recording() {
            return this.$store.state.media.recording;
        },
    },
    methods: {
        onPageLoaded(args) {
            //
        },
        onUnloaded() {
            //
        },
        startOrResume() {
            if (this.recording) {
                return this.$store.dispatch(ActionTypes.AUDIO_RESUME);
            }
            return this.$store.dispatch(ActionTypes.AUDIO_RECORD);
        },
        pause() {
            return this.$store.dispatch(ActionTypes.AUDIO_PAUSE);
        },
        stop() {
            return this.$store.dispatch(ActionTypes.AUDIO_STOP).then(() => {
                return this.$emit("stop");
            });
        },
        cancel() {
            if (this.$store.state.media.recording) {
                return this.$store.dispatch(ActionTypes.AUDIO_STOP).then(() => {
                    return this.$emit("cancel");
                });
            }
            return this.$emit("cancel");
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
    margin-top: 5;
    border-bottom-width: 1;
    border-color: $fk-gray-lighter;
}
.large-text-field {
    border-width: 1;
    border-color: white;
    placeholder-color: $fk-gray-hint;
}

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
.lighter {
    color: $fk-gray-text;
}
</style>
