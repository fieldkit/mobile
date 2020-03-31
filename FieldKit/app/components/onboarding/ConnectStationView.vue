<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout :rows="step.hasBackButton ? '75,*,140' : '*,140'">
            <!-- header section -->
            <GridLayout row="0" rows="auto" columns="*" class="m-y-20" v-if="step.hasBackButton">
                <StackLayout col="0" class="round-bkgd m-l-10" verticalAlignment="top" horizontalAlignment="left" @tap="goBack">
                    <Image width="21" src="~/images/Icon_Backarrow.png" />
                </StackLayout>
            </GridLayout>
            <!-- end header section -->

            <ScrollView :row="step.hasBackButton ? 1 : 0">
                <GridLayout rows="auto" columns="*" verticalAlignment="middle">
                    <!-- connection steps -->
                    <StackLayout row="0" v-if="step.regularFormat">
                        <Label class="title text-center m-b-20" :text="step.title" textWrap="true"></Label>
                        <Label
                            v-for="instruction in step.instructions"
                            :key="instruction"
                            class="instruction"
                            :text="instruction"
                            lineHeight="4"
                            textWrap="true"
                        ></Label>
                        <GridLayout rows="*" columns="*">
                            <Image width="75%" verticalAlignment="middle" v-if="displayFrame" :src="displayFrame"></Image>
                        </GridLayout>
                    </StackLayout>
                    <!-- end connection steps section -->

                    <!-- select wifi settings -->
                    <StackLayout row="0" v-if="!step.regularFormat" verticalAlignment="middle">
                        <GridLayout rows="*" columns="*">
                            <StackLayout row="0" verticalAlignment="middle">
                                <Label class="title m-t-20 m-b-10 text-center" :text="step.title" textWrap="true"></Label>

                                <Label
                                    v-for="instruction in step.instructions"
                                    :key="instruction"
                                    class="instruction"
                                    :text="instruction"
                                    lineHeight="4"
                                    textWrap="true"
                                ></Label>

                                <!-- radio buttons and info -->
                                <GridLayout
                                    rows="auto,auto"
                                    columns="30,*"
                                    v-for="option in step.options"
                                    :key="step.id"
                                    class="option-container"
                                >
                                    <check-box
                                        row="0"
                                        col="0"
                                        :checked="option.selected"
                                        :isEnabled="!option.selected"
                                        fillColor="#2C3E50"
                                        onCheckColor="#2C3E50"
                                        onTintColor="#2C3E50"
                                        fontSize="18"
                                        boxType="circle"
                                        @checkedChange="$event.value !== option.selected && toggleChoice(option)"
                                    />
                                    <Label row="0" col="1" class="m-t-5 m-l-5" :text="option.text"></Label>
                                    <Label
                                        row="1"
                                        colSpan="2"
                                        class="radio-info size-15"
                                        lineHeight="4"
                                        :text="option.info"
                                        textWrap="true"
                                    ></Label>
                                </GridLayout>
                                <!-- end radio buttons -->
                            </StackLayout>
                        </GridLayout>
                    </StackLayout>
                    <!-- end wifi settings -->
                </GridLayout>
            </ScrollView>

            <!-- sticky next button -->
            <StackLayout :row="step.hasBackButton ? 2 : 1" verticalAlignment="bottom" class="m-x-10">
                <Button
                    class="btn btn-primary btn-padded m-y-10"
                    :text="step.button"
                    :isEnabled="!step.buttonDisabled"
                    @tap="goNext"
                ></Button>
                <Label :text="step.altOption" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
            <!-- end sticky next button -->
        </GridLayout>
    </Page>
</template>

<script>
import { on, off, suspendEvent, resumeEvent } from "tns-core-modules/application";

import routes from "../../routes";
import { _T } from "../../utilities";
import ConnectStationCheck from "./ConnectStationCheck";
import ConnectStationError from "./ConnectStationError";
import ConnectStationForm from "./ConnectStationForm";

export default {
    props: ["stepParam", "stationParam"],
    data() {
        return {
            step: {},
            stations: [],
            frameImage: "",
            displayFrame: null,
        };
    },
    components: {
        ConnectStationCheck,
        ConnectStationError,
        ConnectStationForm,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            on(suspendEvent, args => {
                this.leftOffOn = this.step.name;
            });

            //on(resumeEvent, (args) => {
            //});

            if (this.stationParam) {
                this.station = this.stationParam;
            }

            if (this.leftOffOn) {
                this.step = steps[this.leftOffOn];
                this.setupStep();
            } else if (this.stepParam) {
                this.step = steps[this.stepParam];
                this.setupStep();
                return;
            } else {
                this.step = steps.intro;
            }

            this.frameImage = this.step.images[0];
            this.displayFrame = this.frameImage ? "~/images/" + this.frameImage : null;
            if (this.displayFrame && !this.animateFrameTimer) {
                this.animateFrameTimer = setInterval(this.animateFrames, 1000);
            }
        },

        unsubscribe() {
            off(suspendEvent);
            // off(resumeEvent);
        },

        goBack(event) {
            this.stopAnimation();
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            if (this.step.prev) {
                this.step = steps[this.step.prev];
                this.setupStep();
            } else {
                this.unsubscribe();
                this.$navigateTo(routes.assembleStation, {
                    props: {
                        stepParam: "last",
                    },
                });
            }
        },

        goNext() {
            this.stopAnimation();

            if (this.step.next && this.step.next == "goToStations") {
                this.goToStations();
                return;
            }

            if (this.step.next) {
                this.step = steps[this.step.next];
                this.setupStep();
            }
        },

        setupStep() {
            if (this.step.hasError) {
                this.unsubscribe();
                this.$navigateTo(ConnectStationError, {
                    props: {
                        stepParam: this.step.name,
                    },
                });
                return;
            }

            if (this.step.hasForm) {
                this.unsubscribe();
                this.$navigateTo(ConnectStationForm, {
                    props: {
                        stepParam: this.step.field,
                        station: this.station,
                    },
                });
                return;
            }

            if (this.step.testingConnection) {
                this.unsubscribe();
                this.$navigateTo(ConnectStationCheck, {
                    props: {
                        stepParam: "testConnection",
                        proceed: this.step.proceed,
                        stationParam: this.station,
                    },
                });
                return;
            }

            if (this.step.images && this.step.images.length > 0) {
                this.animateFrames();
                if (!this.animateFrameTimer) {
                    this.animateFrameTimer = setInterval(this.animateFrames, 1000);
                }
            }
        },

        skip() {
            this.stopAnimation();

            if (this.step.skip) {
                this.step.next = this.step.skip;
            }
            if (this.step.next) {
                this.goNext();
            } else {
                this.unsubscribe();
                this.$navigateTo(routes.stations);
            }
        },

        toggleChoice(radioOption) {
            this.step.options.forEach(option => {
                option.selected = false;
                if (option.text == radioOption.text) {
                    option.selected = true;
                    this.step.next = radioOption.next;
                }
            });
        },

        stopAnimation() {
            this.displayFrame = null;
            clearInterval(this.animateFrameTimer);
            this.animateFrameTimer = null;
        },

        animateFrames() {
            this.frameImage = this.frameImage == this.step.images[0] ? this.step.images[1] : this.step.images[0];
            this.displayFrame = this.frameImage ? "~/images/" + this.frameImage : null;
        },

        goToStations() {
            this.stopAnimation();
            this.unsubscribe();
            this.$navigateTo(routes.stations, {
                clearHistory: true,
                backstackVisible: false,
            });
        },
    },
};

const steps = {
    intro: {
        name: "intro",
        prev: null,
        next: "connect",
        hasBackButton: true,
        regularFormat: true,
        title: "FieldKit Station WiFi",
        instructions: [
            "Your FieldKit station has its own WiFi signal, acting as a hotspot and allowing connection to your mobile device.",
            "Confirm that your station WiFi is on by pressing the external WiFi button.",
        ],
        button: "Continue",
        images: ["TI_9-A.jpg", "TI_9-B.jpg"],
        altOption: "Skip this step",
    },
    connect: {
        name: "connect",
        prev: "intro",
        next: "testConnection",
        hasBackButton: true,
        regularFormat: true,
        title: "Connect your FieldKit Station",
        instructions: [
            "To connect to your station, go to your mobile phone WiFi settings and select the station's WiFi name as displayed on the station screen.",
        ],
        button: "Done",
        images: ["TI_10-A.jpg", "TI_10-A.jpg"],
        altOption: "Skip this step",
    },
    selectSettings: {
        name: "selectSettings",
        prev: "selectStation",
        next: "rename",
        hasBackButton: false,
        regularFormat: false,
        title: "Choose WiFi Settings",
        instructions: ["Choose how you would like to sync your data"],
        button: "Next",
        images: [],
        options: [
            {
                id: 1,
                text: "Station WiFi (default)",
                info: "Your FieldKit station has its own WiFi signal, acting as a hotspot and allowing connection to a mobile device",
                next: "rename",
                selected: true,
            },
            {
                id: 2,
                text: "Your WiFi Network",
                info:
                    "Connect your FieldKit station to your own WiFi network to sync data with the FieldKit portal directly. Unfortunately, only 2.4GHz WiFi is currently supported.",
                next: "ssid",
                selected: false,
            },
        ],
    },
    rename: {
        name: "rename",
        hasForm: true,
        prev: "selectSettings",
        next: "reconnect",
        field: "stationName",
    },
    reconnect: {
        name: "reconnect",
        prev: "rename",
        next: "testNewConnection",
        hasBackButton: true,
        regularFormat: true,
        title: "Reconnect to your FieldKit Station",
        instructions: [
            "To reconnect to your station, go to your mobile phone WiFi settings and select the station's new WiFi name as displayed on the station screen.",
        ],
        button: "Done",
        images: ["TI_10-A.jpg", "TI_10-A.jpg"],
        altOption: "Skip this step",
    },
    ssid: {
        name: "ssid",
        hasForm: true,
        prev: "selectSettings",
        next: "password",
        field: "ssid",
    },
    password: {
        name: "password",
        hasForm: true,
        prev: "ssid",
        next: "testNewConnection",
        field: "password",
    },
    testConnection: {
        name: "testConnection",
        testingConnection: true,
        prev: "",
        next: "",
        proceed: "selectStation",
    },
    testNewConnection: {
        name: "testNewConnection",
        testingConnection: true,
        prev: "",
        next: "",
        proceed: "startCalibration",
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
// End custom common variables
// Custom styles
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
