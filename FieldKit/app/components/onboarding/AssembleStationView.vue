<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout rows="75,*,80">
            <!-- header section -->
            <GridLayout
                row="0"
                rows="auto"
                columns="15*,70*,15*"
                class="m-y-20"
            >
                <template v-if="step > 0">
                    <StackLayout
                        col="0"
                        class="round-bkgd"
                        verticalAlignment="top"
                        @tap="goBack"
                    >
                        <Image width="21" src="~/images/Icon_Backarrow.png" />
                    </StackLayout>
                    <StackLayout col="1" verticalAlignment="middle">
                        <Label
                            class="title text-center"
                            :text="title"
                            textWrap="true"
                        ></Label>
                    </StackLayout>
                    <StackLayout col="2" />
                </template>
            </GridLayout>
            <!-- end header section -->

            <!-- assembly steps -->
            <StackLayout row="1">
                <!-- progress bar at top -->
                <GridLayout
                    order="1"
                    rows="auto"
                    columns="*"
                    class="top-line-bkgd"
                    v-if="step > 1"
                >
                    <StackLayout
                        horizontalAlignment="left"
                        :width="percentDone + '%'"
                        class="top-line"
                    ></StackLayout>
                </GridLayout>
                <!-- end progress bar -->

                <Label
                    order="2"
                    v-if="step > 0"
                    class="instruction"
                    :text="instruction"
                    lineHeight="4"
                    textWrap="true"
                ></Label>

                <StackLayout order="3" class="m-x-30">
                    <!-- conditional list needs to be wrapped in StackLayout or else
                        error occurs about reference node has a different parent -->
                    <Gridlayout
                        rows="auto,auto,auto,auto,auto,auto"
                        columns="40*,40*"
                        class="checklist"
                        v-if="step == 1"
                    >
                        <Label
                            v-for="item in checklist"
                            class="checklist-item"
                            :key="item.id"
                            :row="item.row"
                            :col="item.col"
                            :text="item.text"
                        />
                        <Label
                            row="6"
                            col="1"
                            horizontalAlignment="right"
                            class="m-t-10"
                            text="*not included"
                        />
                    </Gridlayout>
                </StackLayout>

                <GridLayout order="4" rows="*" columns="*">
                    <Image
                        verticalAlignment="middle"
                        v-if="displayFrame"
                        :src="displayFrame"
                    ></Image>
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
                <Button
                    v-if="step > 0"
                    class="btn btn-primary btn-padded"
                    :text="buttonText"
                    @tap="goNext"
                ></Button>
            </StackLayout>
            <!-- end sticky next button -->

            <!-- final screen -->
            <StackLayout
                rowSpan="3"
                v-if="step == lastStep"
                height="100%"
                backgroundColor="white"
                verticalAlignment="middle"
            >
                <GridLayout rows="auto, auto" columns="*">
                    <Image
                        row="0"
                        src="~/images/Icon_Success.png"
                        class="small"
                    ></Image>
                    <Label
                        row="1"
                        class="instruction"
                        :text="instruction"
                        lineHeight="4"
                        textWrap="true"
                    ></Label>
                </GridLayout>
            </StackLayout>
            <!-- end final screen -->

            <!-- intro screen -->
            <!-- needs to be "on top of" assembly steps section -->
            <FlexboxLayout
                rowSpan="3"
                v-if="step == 0"
                flexDirection="column"
                justifyContent="center"
                class=" m-b-10"
            >
                <Image
                    class="logo"
                    src="~/images/fieldkit-logo-blue.png"
                ></Image>
                <Image
                    class="illo"
                    src="~/images/FieldKit_welcome_image.jpg"
                ></Image>
                <StackLayout class="welcome-text-container">
                    <Label text="Welcome!" class="welcome text-center" />
                    <Label
                        text="Our mobile app makes it easy to set up and deploy your FieldKit station."
                        textWrap="true"
                        lineHeight="4"
                        class="m-t-5 m-x-20"
                    />
                </StackLayout>
                <StackLayout class="m-x-10">
                    <Button
                        class="btn btn-primary btn-padded"
                        text="Get Started"
                        @tap="goNext"
                    ></Button>
                </StackLayout>
                <Label
                    text="Skip instructions"
                    class="skip"
                    @tap="skip"
                    textWrap="true"
                />
            </FlexboxLayout>
            <!-- end intro screen -->
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../../routes";

export default {
    props: ["stepParam"],
    data() {
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
            checklist: checklist
        };
    },
    components: {},
    methods: {
        onPageLoaded() {
            if (this.stepParam) {
                this.step =
                    this.stepParam == "last"
                        ? this.lastStep - 2
                        : this.stepParam == "first"
                        ? 0
                        : this.stepParam;
                this.goNext();
            }
            if (!this.animateFrameTimer) {
                this.animateFrameTimer = setInterval(this.animateFrames, 1000);
            }
        },

        onUnloaded() {
            this.stopAnimation();
        },

        goBack(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            if (this.step > 0) {
                this.step -= 1;
                this.animateFrames();
                this.title = steps[this.step].title;
                this.instruction = steps[this.step].instruction;
                this.buttonText = steps[this.step].button;
                this.percentDone = (this.step / (steps.length - 1)) * 100;
                this.noImageText = steps[this.step].noImage;
            }
        },

        goNext() {
            if (this.step < steps.length - 1) {
                this.step += 1;
                this.animateFrames();
                this.title = steps[this.step].title;
                this.instruction = steps[this.step].instruction;
                this.buttonText = steps[this.step].button;
                this.percentDone = (this.step / (steps.length - 1)) * 100;
                this.noImageText = steps[this.step].noImage;
                if (this.step == steps.length - 1) {
                    setTimeout(() => {
                        this.$navigateTo(routes.connectStation);
                    }, 4000);
                }
            }
        },

        skip() {
            this.$navigateTo(routes.stations);
        },

        stopAnimation() {
            this.displayFrame = null;
            clearInterval(this.animateFrameTimer);
            this.animateFrameTimer = null;
        },

        animateFrames() {
            this.frameImage =
                this.frameImage == steps[this.step].images[0]
                    ? steps[this.step].images[1]
                    : steps[this.step].images[0];
            this.displayFrame = this.frameImage
                ? "~/images/" + this.frameImage
                : null;
        }
    }
};

const steps = [
    {
        // placeholder for intro screen step
        title: "",
        instruction: "",
        button: "",
        images: []
    },
    {
        title: "Do You Have Everything?",
        instruction:
            "Check that you have all of the necessary parts to assemble your FieldKit",
        button: "Assemble Station",
        images: ["TI_1-A.jpg", "TI_1-A.jpg"]
    },
    {
        title: "Assemble Station",
        instruction: "Place your core board and radio board together",
        button: "Next",
        images: ["TI_2-A.jpg", "TI_2-B.jpg"]
    },
    {
        title: "Assemble Station",
        instruction:
            "Take the combined core board and radio board and attach it to the back plane.",
        button: "Next",
        images: ["TI_3-A.jpg", "TI_3-B.jpg"]
    },
    {
        title: "Assemble Station",
        instruction:
            "Attach your individual modules to the back plane, then secure them with screws.",
        button: "Next",
        images: ["TI_4-A.jpg", "TI_4-B.jpg"]
    },
    {
        title: "Assemble Station",
        instruction:
            "Now it's time to take all of your attached components and place them inside the station enclosure. Secure the system down with screws.",
        button: "Next",
        images: ["TI_5-A.jpg", "TI_5-B.jpg"]
    },
    {
        title: "Assemble Station",
        instruction:
            'Attach the battery at the top of the radio board where it says "Battery."',
        button: "Next",
        images: ["TI_6-A.jpg", "TI_6-B.jpg"]
    },
    {
        title: "Assemble Station",
        instruction:
            'Insert the button cord to the radio board into the port labeled "BTN."',
        button: "Done",
        images: ["TI_7-A.jpg", "TI_7-B.jpg"]
    },
    {
        title: "Assemble Station",
        instruction:
            "Plug in your micro USB cable to charge the station battery.",
        button: "Next",
        noImage: "Image coming soon",
        images: []
    },
    {
        title: "Assemble Station",
        instruction:
            "Make sure that the switch is in the \"On\" position. Leave plugged in to charge for an hour.",
        button: "Next",
        noImage: "Image coming soon",
        images: []
    },
    {
        title: "Complete",
        instruction: "Station Assembled",
        button: "Continue",
        images: []
    }
];

const checklist = [
    {
        id: 1,
        row: 1,
        col: 0,
        text: "\u{2022} Enclosure"
    },
    {
        id: 2,
        row: 2,
        col: 0,
        text: "\u{2022} Radio board"
    },
    {
        id: 3,
        row: 3,
        col: 0,
        text: "\u{2022} Core board"
    },
    {
        id: 4,
        row: 4,
        col: 0,
        text: "\u{2022} Back plane"
    },
    {
        id: 5,
        row: 5,
        col: 0,
        text: "\u{2022} Module(s)"
    },
    {
        id: 6,
        row: 1,
        col: 1,
        text: "\u{2022} 1 battery"
    },
    {
        id: 7,
        row: 2,
        col: 1,
        text: "\u{2022} Screws"
    },
    {
        id: 8,
        row: 3,
        col: 1,
        text: "\u{2022} Screw driver*"
    },
    {
        id: 9,
        row: 4,
        col: 1,
        text: "\u{2022} Micro USB cable*"
    }
];
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
// End custom common variables
// Custom styles
.page {
    color: $fk-primary-black;
}
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
