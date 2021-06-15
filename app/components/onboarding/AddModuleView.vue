<template>
    <Page @loaded="onPageLoaded" @unloaded="onUnloaded">
        <PlatformHeader :title="currentStation.name" :canNavigateSettings="false" />

        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="currentStation.connected" />

            <SkipLayout row="1" :buttonLabel="_L('next')" :buttonEnabled="currentStation.connected" @button="goNext">
                <GridLayout row="0" rows="auto,auto" columns="*" class="">
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
            </SkipLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { LegacyStation, ScanStationModulesAction } from "~/store";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";
import { routes } from "@/routes";

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
        currentStation(): LegacyStation {
            return this.$s.getters.legacyStations[this.stationId];
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
            await this.$store.dispatch(new ScanStationModulesAction(this.currentStation.deviceId));

            await Promise.all([
                this.$deprecatedNavigateTo(routes.onboarding.recalibrate, {
                    props: {
                        stationId: this.currentStation.id,
                        bookmark: true,
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
