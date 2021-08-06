<template>
    <Page @loaded="onPageLoaded" @navigatingFrom="onNavigatingFrom">
        <PlatformHeader :title="_L('fieldkitWifi')" :onBack="back" :canNavigateSettings="false" />

        <SkipLayout :buttonLabel="_L('continue')" @button="forward" :skipLabel="_L('skipStep')" @skip="skip" :scrollable="true">
            <GridLayout rows="auto" columns="*" verticalAlignment="middle" v-show="step == 0">
                <StackLayout row="0">
                    <Label class="instruction" :text="_L('introConnectStep1')" lineHeight="4" textWrap="true"></Label>
                    <Label class="instruction" :text="_L('introConnectStep2')" lineHeight="4" textWrap="true"></Label>

                    <GridLayout rows="*" columns="*">
                        <Image width="75%" verticalAlignment="middle" src="~/images/TI_9-A.jpg" v-if="frame % 2 == 0"></Image>
                        <Image width="75%" verticalAlignment="middle" src="~/images/TI_9-B.jpg" v-if="frame % 2 == 1"></Image>
                    </GridLayout>
                </StackLayout>
            </GridLayout>

            <GridLayout rows="auto" columns="*" verticalAlignment="middle" v-show="step == 1">
                <StackLayout row="0">
                    <Label class="title text-center m-b-20" :text="_L('connectYourStation')" textWrap="true"></Label>

                    <Label class="instruction" :text="_L('connectStep1')" lineHeight="4" textWrap="true"></Label>

                    <GridLayout rows="*" columns="*">
                        <Image width="75%" verticalAlignment="middle" src="~/images/TI_10-A.jpg"></Image>
                    </GridLayout>
                </StackLayout>
            </GridLayout>
        </SkipLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { fullRoutes, routes } from "@/routes";
import { debug, Timer } from "@/lib";
import AppSettings from "@/wrappers/app-settings";

const Start = Vue.extend({
    components: {
        ...SharedComponents,
    },
    props: {
        step: {
            type: Number,
            default: 0,
        },
    },
    data(): {
        frame: number;
    } {
        return {
            frame: 0,
        };
    },
    methods: {
        onPageLoaded(): void {
            debug.log("onboarding/start:", "loaded");
            this.frame = 0;
            const thisAny = this as any;
            thisAny.timer = new Timer(1000, () => {
                this.frame += 1;
            });
        },
        onNavigatingFrom(): void {
            debug.log("onboarding/start:", "nav away");
            const thisAny = this as any;
            thisAny.timer.stop();
        },
        async forward(): Promise<void> {
            if (this.step < 1) {
                await this.$navigateTo(Start, {
                    frame: "stations-frame",
                    props: {
                        step: this.step + 1,
                    },
                });
            } else {
                await this.$deprecatedNavigateTo(routes.onboarding.searching, {
                    backstackVisible: false,
                });
            }
        },
        async back(): Promise<void> {
            debug.log("onboarding/start:", "back");
            await this.$navigateBack();
        },
        async skip(): Promise<any> {
            this.incrementSkipCount();
            await this.$deprecatedNavigateTo(fullRoutes.tabbed);
        },
        incrementSkipCount(): void {
            const appSettings = new AppSettings();
            const skipCount = appSettings.getNumber("skipCount", 0);
            appSettings.setNumber('skipCount', skipCount + 1);
        },
    },
});

export default Start;
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}
.small {
    width: 50;
    margin: 20;
}
.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.gray-text {
    color: $fk-gray-hint;
}
.red-text {
    color: $fk-primary-red;
}
</style>
