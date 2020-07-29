<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout rows="75,*,80">
            <!-- header section -->
            <GridLayout row="0" rows="auto" columns="15*,70*,15*" class="m-y-20">
                <template v-if="step > 0">
                    <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="goBack">
                        <Image width="21" src="~/images/Icon_Backarrow.png" />
                    </StackLayout>
                    <StackLayout col="1" verticalAlignment="middle">
                        <Label class="title text-center" :text="title" textWrap="true"></Label>
                    </StackLayout>
                    <StackLayout col="2" />
                </template>
            </GridLayout>
            <!-- end header section -->

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

            <!-- intro screen -->
            <!-- needs to be "on top of" assembly steps section -->
            <FlexboxLayout rowSpan="3" v-if="step == 0" flexDirection="column" justifyContent="center" class="m-b-10">
                <Image class="logo" src="~/images/fieldkit-logo-blue.png"></Image>
                <Image class="illo" src="~/images/FieldKit_welcome_image.jpg"></Image>
                <StackLayout class="welcome-text-container">
                    <Label :text="_L('welcome')" class="welcome text-center" />
                    <Label :text="_L('mobileAppIntro')" textWrap="true" lineHeight="4" class="m-t-5 m-x-20" />
                </StackLayout>
                <StackLayout class="m-x-10">
                    <Button class="btn btn-primary btn-padded" :text="_L('getStarted')" @tap="goNext"></Button>
                </StackLayout>
                <Label :text="_L('skipInstructions')" class="skip" @tap="skip" textWrap="true" />
            </FlexboxLayout>
            <!-- end intro screen -->
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "../../routes";
import AppSettings from "../../wrappers/app-settings";

export default Vue.extend({
    props: {
        stepParam: {},
    },
    data() {
        const steps = createSteps();
        return {
            step: 0,
            lastStep: steps.length - 1,
            title: "",
            instruction: "",
            buttonText: "",
            frameImage: "",
            displayFrame: null,
            noImageText: null,
            percentDone: (1 / (steps.length - 1)) * 100,
            steps: steps,
            checklist: createCheckList(),
        };
    },
    components: {},
    methods: {
        onPageLoaded(this: any) {
            this._appSettings = new AppSettings();
            if (this.stepParam) {
                this.step = this.stepParam == "last" ? this.lastStep - 2 : this.stepParam == "first" ? 0 : this.stepParam;
                this.goNext();
            }
            if (!this.animateFrameTimer) {
                this.animateFrameTimer = setInterval(this.animateFrames, 1000);
            }
        },
        onUnloaded(this: any) {
            this.stopAnimation();
        },
        goBack(this: any, event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            if (this.step > 0) {
                this.step -= 1;
                this.animateFrames();
                this.title = this.steps[this.step].title;
                this.instruction = this.steps[this.step].instruction;
                this.buttonText = this.steps[this.step].button;
                this.percentDone = (this.step / (this.steps.length - 1)) * 100;
            }
        },
        goNext(this: any) {
            if (this.step < this.steps.length - 1) {
                this.step += 1;
                this.animateFrames();
                this.title = this.steps[this.step].title;
                this.instruction = this.steps[this.step].instruction;
                this.buttonText = this.steps[this.step].button;
                this.percentDone = (this.step / (this.steps.length - 1)) * 100;
                if (this.step == this.steps.length - 1) {
                    setTimeout(() => {
                        this.$navigateTo(routes.onboarding.start);
                    }, 3000);
                }
            }
        },
        skip(this: any) {
            let skipCount = this._appSettings.getNumber("skipCount");
            if (!skipCount) {
                skipCount = 0;
            }
            skipCount += 1;
            this._appSettings.setNumber("skipCount", skipCount);
            this.$navigateTo(routes.stations);
        },
        stopAnimation(this: any) {
            this.displayFrame = null;
            clearInterval(this.animateFrameTimer);
            this.animateFrameTimer = null;
        },
        animateFrames(this: any) {
            this.frameImage =
                this.frameImage == this.steps[this.step].images[0] ? this.steps[this.step].images[1] : this.steps[this.step].images[0];
            this.displayFrame = this.frameImage ? "~/images/" + this.frameImage : null;
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
    width: 115;
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
    font-size: 14;
    font-weight: bold;
    text-align: center;
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
