<template>
    <StackLayout class="recording-container">
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
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import * as ActionTypes from "@/store/actions";
import { ActiveRecording } from "@/store";
import { Timer } from "@/common/timer";

export default Vue.extend({
    data(): { timer: any; now: Date } {
        return {
            timer: null,
            now: new Date(),
        };
    },
    computed: {
        recording(): ActiveRecording {
            console.log("recording", this.$store.state.media.recording, this.now);
            return this.$store.state.media.recording;
        },
    },
    mounted(): void {
        this.timer = new Timer(1000, () => {
            this.now = new Date();
        });
    },
    destroyed(): void {
        this.timer.stop();
    },
    methods: {
        onPageLoaded(): void {},
        onUnloaded(): void {},
        startOrResume(): Promise<any> {
            if (this.recording) {
                return this.$store.dispatch(ActionTypes.AUDIO_RESUME);
            }
            return this.$store.dispatch(ActionTypes.AUDIO_RECORD);
        },
        pause(): Promise<any> {
            return this.$store.dispatch(ActionTypes.AUDIO_PAUSE);
        },
        stop(): Promise<any> {
            return this.$store.dispatch(ActionTypes.AUDIO_STOP).then((recording) => {
                return this.$emit("stop", recording);
            });
        },
        cancel(): Promise<any> {
            if (this.$store.state.media.recording) {
                return this.$store.dispatch(ActionTypes.AUDIO_STOP).then(() => {
                    return this.$emit("cancel");
                });
            }
            this.$emit("cancel");
            return Promise.resolve();
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.recording-container {
    padding-top: 10;
}
.recording-box {
    padding: 10;
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
}
/*
.small-round {
    width: 40;
    padding: 2;
    border-radius: 20;
}
*/
</style>
