<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout rows="auto,*,80">
            <GridLayout row="0" rows="auto,auto" columns="*" class="">
                <StackLayout row="0" verticalAlignment="middle">
                    <ConnectionStatusHeader :connected="currentStation.connected" />
                    <Label class="m-y-20 title text-center" :text="currentStation.name" textWrap="true"></Label>
                </StackLayout>
                <GridLayout row="1" rows="auto, auto" columns="*,*" width="80%" class="m-t-10 m-b-20">
                    <Image row="0" colSpan="2" class="m-b-10 m-l-15 m-r-15" src="~/images/Icon_incomplete.png" />
                    <Label row="1" col="0" horizontalAlignment="left" :text="_L('connect')" />
                    <Label row="1" col="1" horizontalAlignment="right" :text="_L('setup')" />
                </GridLayout>
            </GridLayout>
            <StackLayout row="1">
                <Label order="2" class="instruction" :text="_L('assembleStep4')" lineHeight="4" textWrap="true"></Label>
                <GridLayout order="4" rows="*" columns="*">
                    <Image verticalAlignment="middle" v-if="displayFrame" :src="displayFrame"></Image>
                </GridLayout>
            </StackLayout>
            <StackLayout row="2" class="m-x-10">
                <Button class="btn btn-primary btn-padded" :text="_L('next')" @tap="goNext"></Button>
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import routes from "@/routes";
import * as animations from "../animations";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";
import { Station } from "~/store";

export default Vue.extend({
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data(): {
        title: string;
        instruction: string;
        buttonText: string;
        frameImage: string;
        displayFrame: string;
        animateFrameTimer: number;
    } {
        return {
            title: "",
            instruction: "",
            buttonText: "",
            frameImage: "",
            displayFrame: "",
            animateFrameTimer: 0,
        };
    },
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
    },
    computed: {
        currentStation(): Station {
            return this.$s.getters.stationsById[this.stationId];
        },
    },
    methods: {
        onPageLoaded(): void {
            this.animateFrames();

            const thisAny = this as any;
            if (!thisAny.animateFrameTimer) {
                thisAny.animateFrameTimer = setInterval(this.animateFrames, 1000);
            }
        },
        onUnloaded(): void {
            this.stopAnimation();
        },
        async goNext(ev: Event): Promise<void> {
            await Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.onboarding.recalibrate, {
                    clearHistory: true,
                    props: {
                        stationId: this.currentStation.id,
                    },
                }),
            ]);
        },
        stopAnimation(): void {
            this.displayFrame = "";
            const thisAny = this as any;
            clearInterval(thisAny.animateFrameTimer);
        },
        animateFrames(): void {
            this.frameImage = this.frameImage == "TI_4-A.jpg" ? "TI_4-B.jpg" : "TI_4-A.jpg";
            this.displayFrame = this.frameImage ? "~/images/" + this.frameImage : "";
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.logo {
    margin-top: 8%;
    width: 50%;
}

.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}

.small {
    width: 50;
    margin: 20;
}
</style>
