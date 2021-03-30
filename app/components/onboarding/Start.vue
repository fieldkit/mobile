<template>
    <Page @loaded="onPageLoaded" @navigatingFrom="onNavigatingFrom">
        <PlatformHeader :title="_L('fieldkitWifi')" :onBack="back" :canNavigateSettings="false" />
        <GridLayout rows="*,auto" class="container">
            <ScrollView row="0" v-show="step == 0">
                <GridLayout rows="auto" columns="*" verticalAlignment="middle">
                    <StackLayout row="0">
                        <Label class="instruction" :text="_L('introConnectStep1')" lineHeight="4" textWrap="true"></Label>
                        <Label class="instruction" :text="_L('introConnectStep2')" lineHeight="4" textWrap="true"></Label>

                        <GridLayout rows="*" columns="*">
                            <Image width="75%" verticalAlignment="middle" src="~/images/TI_9-A.jpg" v-if="frame % 2 == 0"></Image>
                            <Image width="75%" verticalAlignment="middle" src="~/images/TI_9-B.jpg" v-if="frame % 2 == 1"></Image>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <ScrollView row="0" v-show="step == 1">
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

            <StackLayout row="1" verticalAlignment="bottom">
                <Button class="btn btn-primary btn-padded" :text="_L('continue')" @tap="forward" />
                <Label :text="_L('skipStep')" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { fullRoutes, routes } from "@/routes";
import { Timer } from "@/lib";

export default Vue.extend({
    components: {
        ...SharedComponents,
    },
    data(): {
        frame: number;
        step: number;
    } {
        return {
            frame: 0,
            step: 0,
        };
    },
    methods: {
        onPageLoaded(): void {
            console.log("onboarding/start:", "loaded");
            this.step = 0;
            this.frame = 0;
            const thisAny = this as any;
            thisAny.timer = new Timer(1000, () => {
                this.frame += 1;
            });
        },
        onNavigatingFrom(): void {
            console.log("onboarding/start:", "nav away");
            const thisAny = this as any;
            thisAny.timer.stop();
        },
        async forward(): Promise<void> {
            this.step++;
            if (this.step == 2) {
                await this.$navigateTo(routes.onboarding.searching, {
                    backstackVisible: false,
                });
            }
        },
        async back(): Promise<void> {
            console.log("onboarding/start:", "back");
            if (this.step > 0) {
                this.step -= 1;
            } else {
                await this.$navigateBack();
            }
        },
        async skip(): Promise<any> {
            await this.$navigateTo(fullRoutes.tabbed);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.skip {
    width: 115;
    padding-top: 10;
    padding-bottom: 10;
    font-size: 14;
    font-weight: bold;
    text-align: center;
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
.btn-primary {
    margin-bottom: 0;
}
</style>
