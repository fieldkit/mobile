<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" navigatingTo="onNavigatingTo">
        <GridLayout rows="75,*,140">
            <GridLayout row="0" rows="auto" columns="*" class="m-y-20">
                <StackLayout col="0" class="round-bkgd m-l-10" verticalAlignment="top" horizontalAlignment="left" @tap="back">
                    <Image width="21" src="~/images/Icon_Backarrow.png" />
                </StackLayout>
            </GridLayout>

            <ScrollView row="1" v-show="step == 0">
                <GridLayout rows="auto" columns="*" verticalAlignment="middle">
                    <StackLayout row="0">
                        <Label class="title text-center m-b-20" :text="_L('fieldkitWifi')" textWrap="true"></Label>

                        <Label class="instruction" :text="_L('introConnectStep1')" lineHeight="4" textWrap="true"></Label>
                        <Label class="instruction" :text="_L('introConnectStep2')" lineHeight="4" textWrap="true"></Label>

                        <GridLayout rows="*" columns="*">
                            <Image width="75%" verticalAlignment="middle" src="~/images/TI_9-A.jpg" v-if="frame % 2 == 0"></Image>
                            <Image width="75%" verticalAlignment="middle" src="~/images/TI_9-B.jpg" v-if="frame % 2 == 1"></Image>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <ScrollView row="1" v-show="step == 1">
                <GridLayout rows="auto" columns="*" verticalAlignment="middle">
                    <StackLayout row="0">
                        <Label class="title text-center m-b-20" :text="_L('connectYourStation')" textWrap="true"></Label>

                        <Label class="instruction" :text="_L('connectStep1')" lineHeight="4" textWrap="true"></Label>

                        <GridLayout rows="*" columns="*">
                            <Image width="75%" verticalAlignment="middle" src="~/images/TI_10-A.jpg"></Image>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout :row="2" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('continue')" @tap="forward"></Button>
                <Label :text="_L('skipStep')" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "../../routes";
import { _T } from "../../utilities";
import { Timer } from "../../common/timer";

export default Vue.extend({
    props: {},
    data(): { frame: number; step: number } {
        return {
            frame: 0,
            step: 0,
        };
    },
    methods: {
        onPageLoaded(args): void {
            console.log("onboarding/start:", "loaded");

            const thisAny = this as any;
            thisAny.timer = new Timer(1000, () => {
                this.frame += 1;
            });
        },
        onNavigatingTo(): void {
            console.log("nav away");
            const thisAny = this as any;
            thisAny.timer.stop();
        },
        forward(): Promise<any> {
            this.step++;
            if (this.step == 2) {
                return this.$navigateTo(routes.onboarding.searching, {
                    clearHistory: true,
                    backstackVisible: false,
                });
            }
            return Promise.resolve();
        },
        back(this: any): Promise<any> {
            console.log("onboarding/start:", "back");
            return this.$navigateTo(routes.stations, {
                clearHistory: true,
                backstackVisible: false,
            });
        },
        skip(this: any): Promise<any> {
            return this.$navigateTo(routes.stations, {
                clearHistory: true,
                backstackVisible: false,
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.skip {
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
    font-size: 14;
    font-weight: bold;
    text-align: center;
    margin: 10;
}
.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}
.option-container {
    margin-top: 30;
    margin-left: 30;
    margin-right: 30;
}
.radio-info {
    color: $fk-gray-hint;
    margin-top: 10;
    margin-bottom: 20;
    margin-left: 35;
}
.input {
    width: 90%;
    margin-left: 20;
    margin-right: 20;
    border-bottom-width: 1px;
    text-align: center;
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
