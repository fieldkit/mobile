<template>
    <Page @loaded="onPageLoaded" actionBarHidden="true" @unloaded="onUnloaded">
        <template v-if="step == 0">
            <GridLayout rows="*,140">
                <StackLayout row="0">
                    <Image verticalAlignment="middle" class="logo" src="~/images/fieldkit-logo-blue.png" stretch="aspectFit" />
                    <Image verticalAlignment="middle" class="illo" src="~/images/FieldKit_welcome_image.jpg" stretch="aspectFit" />
                    <StackLayout class="welcome-text-container">
                        <Label :text="_L('welcome')" class="welcome text-center" />
                        <Label :text="_L('mobileAppIntro')" textWrap="true" lineHeight="4" class="m-t-5 m-x-20" />
                    </StackLayout>
                </StackLayout>

                <StackLayout row="1" verticalAlignment="bottom" class="m-x-10">
                    <Button class="btn btn-primary btn-padded m-y-10" :text="_L('getStarted')" @tap="goNext"></Button>
                    <Label :text="_L('skipInstructions')" class="skip" @tap="skip" textWrap="true" />
                </StackLayout>
            </GridLayout>
        </template>
        <template v-else>
            <GridLayout rows="*,80">
                <StackLayout row="0">
                    <GridLayout rows="auto" columns="*" class="top-line-bkgd" v-if="step > 1">
                        <StackLayout horizontalAlignment="left" :width="percentDone + '%'" class="top-line"></StackLayout>
                    </GridLayout>

                    <Label class="instruction" :text="instruction" lineHeight="4" textWrap="true"></Label>

                    <StackLayout class="m-x-30">
                        <Gridlayout rows="auto,auto,auto,auto,auto,auto" columns="40*,40*" class="checklist" v-if="step == 1">
                            <Label
                                v-for="item in checklist"
                                class="checklist-item"
                                :key="item.id"
                                :row="item.row"
                                :col="item.col"
                                :text="item.text"
                            />
                            <Label row="6" col="1" horizontalAlignment="right" class="m-t-10" :text="'*' + _L('notIncluded')" />
                        </Gridlayout>
                    </StackLayout>

                    <GridLayout rows="*" columns="*">
                        <Image verticalAlignment="middle" v-if="displayFrame" :src="displayFrame"></Image>
                        <Label
                            v-if="!displayFrame && noImageText"
                            verticalAlignment="middle"
                            class="m-y-30 m-x-20 text-center size-20"
                            :text="noImageText"
                        />
                    </GridLayout>
                </StackLayout>

                <StackLayout row="1" class="m-x-10" v-if="step > 0">
                    <Button class="btn btn-primary btn-padded" :text="buttonText" @tap="goNext"></Button>
                </StackLayout>

                <StackLayout rowSpan="2" v-if="step == lastStep" height="100%" backgroundColor="white" verticalAlignment="middle">
                    <GridLayout rows="auto, auto" columns="*">
                        <Image row="0" src="~/images/Icon_Success.png" class="small"></Image>
                        <Label row="1" class="instruction" :text="instruction" lineHeight="4" textWrap="true"></Label>
                    </GridLayout>
                </StackLayout>
            </GridLayout>
        </template>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { routes, fullRoutes } from "@/routes";
import AppSettings from "@/wrappers/app-settings";
import { promiseAfter } from "@/lib";

export default Vue.extend({
    components: {
        ...SharedComponents,
    },
    props: {
        stepParam: {},
    },
    data(): {
        step: number;
        lastStep: number;
        title: string;
        instruction: string;
        buttonText: string;
        frameImage: string;
        displayFrame: string;
        animateFrameTimer: number;
        noImageText: string | null;
        percentDone: number;
        steps: { title: string; instruction: string; button: string; images: string[] }[];
        checklist: { id: number; row: number; col: number; text: string }[];
    } {
        const steps = createSteps();
        return {
            step: 0,
            lastStep: steps.length - 1,
            title: "",
            instruction: "",
            buttonText: "",
            frameImage: "",
            displayFrame: "",
            animateFrameTimer: 0,
            noImageText: null,
            percentDone: (1 / (steps.length - 1)) * 100,
            steps: steps,
            checklist: createCheckList(),
        };
    },
    methods: {
        async onPageLoaded(): Promise<void> {
            console.log("AssembleStationView::loaded");
            if (this.step == this.steps.length - 1) {
                await promiseAfter(3000);
                await this.$navigateTo(routes.onboarding.start, {});
            }
            const thisAny = this as any;
            thisAny._appSettings = new AppSettings();
            if (thisAny.stepParam) {
                thisAny.step =
                    thisAny.stepParam == "last" ? this.lastStep - 2 : thisAny.stepParam == "first" ? 0 : parseInt(thisAny.stepParam);
                this.goNext();
            }
            if (!thisAny.animateFrameTimer) {
                thisAny.animateFrameTimer = setInterval(thisAny.animateFrames, 1000);
            }
        },
        onUnloaded(): void {
            console.log("unloading");
            this.stopAnimation();
        },
        async goBack(ev: Event): Promise<void> {
            if (this.step > 0) {
                this.step -= 1;
                this.animateFrames();
                this.title = this.steps[this.step].title;
                this.instruction = this.steps[this.step].instruction;
                this.buttonText = this.steps[this.step].button;
                this.percentDone = (this.step / (this.steps.length - 1)) * 100;
            } else {
                await this.$navigateTo(fullRoutes.tabbed, {});
            }
        },
        async goNext(): Promise<void> {
            if (this.step < this.steps.length - 1) {
                this.step += 1;
                this.animateFrames();
                this.title = this.steps[this.step].title;
                this.instruction = this.steps[this.step].instruction;
                this.buttonText = this.steps[this.step].button;
                this.percentDone = (this.step / (this.steps.length - 1)) * 100;
                if (this.step == this.steps.length - 1) {
                    await promiseAfter(3000);
                    await this.$navigateTo(routes.onboarding.start, {});
                }
            }
        },
        async skip(): Promise<void> {
            const thisAny = this as any;
            thisAny._appSettings.setNumber("skipCount", (thisAny._appSettings.getNumber("skipCount") || 0) + 1);
            try {
                console.log("skip");
                await this.$navigateTo(routes.onboarding.start, {});
            } catch (err) {
                console.log(err, err.stack);
            }
        },
        stopAnimation(): void {
            clearInterval(this.animateFrameTimer);
        },
        animateFrames(): void {
            this.frameImage =
                this.frameImage == this.steps[this.step].images[0] ? this.steps[this.step].images[1] : this.steps[this.step].images[0];
            this.displayFrame = this.frameImage ? "~/images/" + this.frameImage : "";
        },
    },
});

function createSteps() {
    return [
        {
            // placeholder for intro screen step
            title: "",
            instruction: "",
            button: "",
            images: [],
        },
        {
            title: _L("haveEverything"),
            instruction: _L("assembleStep1"),
            button: _L("assembleStation"),
            images: ["TI_1-A.jpg", "TI_1-A.jpg"],
        },
        {
            title: _L("assembleStation"),
            instruction: _L("assembleStep2"),
            button: "Next",
            images: ["TI_2-A.jpg", "TI_2-B.jpg"],
        },
        {
            title: _L("assembleStation"),
            instruction: _L("assembleStep3"),
            button: "Next",
            images: ["TI_3-A.jpg", "TI_3-B.jpg"],
        },
        {
            title: _L("assembleStation"),
            instruction: _L("assembleStep4"),
            button: "Next",
            images: ["TI_4-A.jpg", "TI_4-B.jpg"],
        },
        {
            title: _L("assembleStation"),
            instruction: _L("assembleStep5"),
            button: "Next",
            images: ["TI_5-A.jpg", "TI_5-B.jpg"],
        },
        {
            title: _L("assembleStation"),
            instruction: _L("assembleStep6"),
            button: "Next",
            images: ["TI_6-A.jpg", "TI_6-B.jpg"],
        },
        {
            title: _L("assembleStation"),
            instruction: _L("assembleStep7"),
            button: "Done",
            images: ["TI_7-A.jpg", "TI_7-B.jpg"],
        },
        {
            title: _L("assembleStation"),
            instruction: _L("assembleStep8"),
            button: "Next",
            images: ["TI_8-A.jpg", "TI_8-B.jpg"],
        },
        {
            title: _L("assembleStation"),
            instruction: _L("assembleStep9"),
            button: "Next",
            images: ["TI_15-A.jpg", "TI_15-B.jpg"],
        },
        {
            title: _L("complete"),
            instruction: _L("assembleStep10"),
            button: _L("continue"),
            images: [],
        },
    ];
}

function createCheckList() {
    return [
        {
            id: 1,
            row: 1,
            col: 0,
            text: "\u{2022} " + _L("enclosure"),
        },
        {
            id: 2,
            row: 2,
            col: 0,
            text: "\u{2022} " + _L("radioBoard"),
        },
        {
            id: 3,
            row: 3,
            col: 0,
            text: "\u{2022} " + _L("coreBoard"),
        },
        {
            id: 4,
            row: 4,
            col: 0,
            text: "\u{2022} " + _L("backPlane"),
        },
        {
            id: 5,
            row: 5,
            col: 0,
            text: "\u{2022} " + _L("moduleParts"),
        },
        {
            id: 6,
            row: 1,
            col: 1,
            text: "\u{2022} 1 " + _L("battery"),
        },
        {
            id: 7,
            row: 2,
            col: 1,
            text: "\u{2022} " + _L("screws"),
        },
        {
            id: 8,
            row: 3,
            col: 1,
            text: "\u{2022} " + _L("microCable"),
        },
        {
            id: 9,
            row: 4,
            col: 1,
            text: "\u{2022} " + _L("screwdriver") + "*",
        },
    ];
}
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.logo {
    margin-top: 50em;
    width: 50%;
    margin-bottom: 20em;
}
.illo {
    width: 75%;
}
.welcome-text-container {
    width: 280;
    text-align: center;
    font-size: 15;
    margin-top: 4%;
    margin-bottom: 4%;
}
.welcome {
    font-weight: bold;
    font-size: 18;
}
.skip {
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
    font-size: 14;
    font-weight: bold;
    text-align: center;
    margin: 10;
}

.top-line-bkgd {
    background-color: $fk-gray-lighter;
    margin-bottom: 40;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}
.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}
.checklist {
    width: 300;
    margin-top: 40;
}
.small {
    width: 50;
    margin: 20;
}
</style>
