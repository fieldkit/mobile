<template>
    <Page @loaded="onPageLoaded" @unloaded="onUnloaded">
        <PlatformHeader :title="title" :onBack="goBack" :canNavigateSettings="false" />
        <GridLayout rows="75,*,80" v-if="step > 0">
            <!-- assembly steps -->
            <StackLayout row="1">
                <!-- progress bar at top -->
                <GridLayout order="1" rows="auto" columns="*" class="top-line-bkgd" v-if="step > 1">
                    <StackLayout horizontalAlignment="left" :width="percentDone + '%'" class="top-line"></StackLayout>
                </GridLayout>
                <!-- end progress bar -->

                <Label order="2" v-if="step > 0" class="instruction" :text="instruction" lineHeight="4" textWrap="true"></Label>

                <StackLayout order="3" class="m-x-30">
                    <!-- conditional list needs to be wrapped in StackLayout or else
                        error occurs about reference node has a different parent -->
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

                <GridLayout order="4" rows="*" columns="*">
                    <Image verticalAlignment="middle" v-if="displayFrame" :src="displayFrame"></Image>
                    <Label
                        verticalAlignment="middle"
                        v-if="!displayFrame && noImageText"
                        class="m-y-30 m-x-20 text-center size-20"
                        :text="noImageText"
                    />
                </GridLayout>
            </StackLayout>
            <!-- end assembly steps section -->

            <!-- sticky next button -->
            <StackLayout row="2" class="m-x-10">
                <Button v-if="step > 0" class="btn btn-primary btn-padded" :text="buttonText" @tap="goNext"></Button>
            </StackLayout>
            <!-- end sticky next button -->

            <!-- final screen -->
            <StackLayout rowSpan="3" v-if="step == lastStep" height="100%" backgroundColor="white" verticalAlignment="middle">
                <GridLayout rows="auto, auto" columns="*">
                    <Image row="0" src="~/images/Icon_Success.png" class="small"></Image>
                    <Label row="1" class="instruction" :text="instruction" lineHeight="4" textWrap="true"></Label>
                </GridLayout>
            </StackLayout>
            <!-- end final screen -->
        </GridLayout>
        <template v-if="step == 0">
            <StackLayout verticalAlignment="bottom" class="m-x-10">
                <Image class="logo" src="~/images/fieldkit-logo-blue.png"></Image>
                <Image class="illo" src="~/images/FieldKit_welcome_image.jpg"></Image>
                <StackLayout class="welcome-text-container">
                    <Label :text="_L('welcome')" class="welcome text-center" />
                    <Label :text="_L('mobileAppIntro')" textWrap="true" lineHeight="4" class="m-t-5 m-x-20" />
                </StackLayout>
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('getStarted')" @tap="goNext"></Button>
                <Label :text="_L('skipInstructions')" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
        </template>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import routes from "@/routes";
import AppSettings from "@/wrappers/app-settings";
import * as animations from "../animations";
import * as application from "@nativescript/core/application";

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
    created(): void {
        if (application.android) {
            application.android.on(application.AndroidApplication.activityBackPressedEvent, (args: any) => {
                if (this.step > 0) {
                    args.cancel = true; //this cancels the normal backbutton behaviour
                    this.step -= 1;
                    this.animateFrames();
                    this.title = this.steps[this.step].title;
                    this.instruction = this.steps[this.step].instruction;
                    this.buttonText = this.steps[this.step].button;
                    this.percentDone = (this.step / (this.steps.length - 1)) * 100;
                }
            });
        }
    },
    methods: {
        onPageLoaded(): void {
            if (this.step == this.steps.length - 1) {
                setTimeout(() => {
                    this.$navigateTo(routes.onboarding.start, {
                        frame: "outer-frame",
                        clearHistory: true,
                    });
                }, 3000);
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
            this.stopAnimation();
        },
        async goBack(ev: Event): Promise<void> {
            console.log("goBack");

            if (this.step > 0) {
                this.step -= 1;
                this.animateFrames();
                this.title = this.steps[this.step].title;
                this.instruction = this.steps[this.step].instruction;
                this.buttonText = this.steps[this.step].button;
                this.percentDone = (this.step / (this.steps.length - 1)) * 100;
                await animations.pressed(ev);
            } else {
                console.log("no more steps");
                await Promise.all([
                    animations.pressed(ev),
                    this.$navigateTo(routes.tabbed, {
                        frame: "outer-frame",
                        clearHistory: true,
                    }),
                ]);
            }
        },
        goNext(): void {
            if (this.step < this.steps.length - 1) {
                this.step += 1;
                this.animateFrames();
                this.title = this.steps[this.step].title;
                this.instruction = this.steps[this.step].instruction;
                this.buttonText = this.steps[this.step].button;
                this.percentDone = (this.step / (this.steps.length - 1)) * 100;
                if (this.step == this.steps.length - 1) {
                    setTimeout(() => {
                        this.$navigateTo(routes.onboarding.start, {
                            frame: "outer-frame",
                            clearHistory: true,
                        });
                    }, 3000);
                }
            }
        },
        async skip(): Promise<void> {
            const thisAny = this as any;
            thisAny._appSettings.setNumber("skipCount", (thisAny._appSettings.getNumber("skipCount") || 0) + 1);
            try {
                console.log("skip");
                await this.$navigateTo(routes.onboarding.start, {
                    frame: "outer-frame",
                    clearHistory: true,
                });
            } catch (err) {
                console.log(err, err.stack);
            }
        },
        stopAnimation(): void {
            this.displayFrame = "";
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
    margin-top: 8%;
    width: 50%;
}
.illo {
    margin-top: 8%;
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
