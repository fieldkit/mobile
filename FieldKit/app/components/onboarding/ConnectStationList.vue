<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,140">
            <ScrollView row="0">
                <GridLayout rows="auto" columns="*" verticalAlignment="middle">
                    <StackLayout row="0" verticalAlignment="middle">
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

                                <!-- stations list -->
                                <StackLayout class="m-t-10"></StackLayout>
                                <GridLayout rows="auto" columns="30,*" class="option-container" v-for="s in stationOptions" :key="s.id">
                                    <check-box
                                        col="0"
                                        :checked="s.selected"
                                        :isEnabled="!s.selected"
                                        fillColor="#2C3E50"
                                        onCheckColor="#2C3E50"
                                        onTintColor="#2C3E50"
                                        fontSize="18"
                                        boxType="circle"
                                        @checkedChange="$event.value !== s.selected && toggleStation(s)"
                                    />
                                    <Label col="1" class="m-t-5 m-l-5" :text="s.name"></Label>
                                </GridLayout>
                                <!-- end stations list -->
                            </StackLayout>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <!-- sticky next button -->
            <StackLayout row="1" verticalAlignment="bottom" class="m-x-10">
                <Button
                    class="btn btn-primary btn-padded m-y-10"
                    :text="step.button"
                    :isEnabled="!step.buttonDisabled"
                    @tap="goNext"
                ></Button>
                <Label :text="step.altOption" class="skip" @tap="tryAgain" textWrap="true" />
            </StackLayout>
            <!-- end sticky next button -->
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../../routes";
import { _T } from "../../utilities";
import Services from "../../services/services";
import ConnectStationCheck from "./ConnectStationCheck";
import ConnectStationError from "./ConnectStationError";

export default {
    props: ["stationOptionsParam"],
    data() {
        return {
            step: {},
            stationOptions: [],
        };
    },
    components: {
        ConnectStationCheck,
        ConnectStationError,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
            this.step = steps["selectStation"];
            this.stationOptions = this.stationOptionsParam;
            this.stationOptions.forEach(s => {
                if (s.selected) {
                    this.station = s;
                }
            });
            this.takeStep();
        },

        goNext() {
            if (this.step.next) {
                this.step = steps[this.step.next];
                this.takeStep();
            }
        },

        takeStep() {
            if (this.step && this.step.hasError) {
                this.$navigateTo(ConnectStationError, {
                    props: {
                        stepParam: this.step.name,
                    },
                });
                return;
            }

            if (this.step && this.step.selectSettings) {
                this.$navigateTo(routes.connectStation, {
                    props: {
                        stepParam: "selectSettings",
                        stationParam: this.station,
                    },
                });
                return;
            }

            if (this.step && this.step.testingConnection) {
                this.$navigateTo(ConnectStationCheck, {
                    props: {
                        stepParam: "testConnection",
                        proceed: this.step.proceed,
                    },
                });
                return;
            }
        },

        toggleStation(radioOption) {
            this.stationOptions.forEach(option => {
                option.selected = false;
                if (option.name == radioOption.name) {
                    option.selected = true;
                    this.station = option;
                }
            });
        },

        tryAgain() {
            this.station = null;
            this.step = steps["trouble"];
            this.goNext();
        },
    },
};

const steps = {
    trouble: {
        hasError: true,
        name: "trouble",
        next: "testConnection",
    },
    selectStation: {
        prev: "connect",
        next: "selectSettings",
        skip: "tryAgain",
        title: "Select Your Station",
        instructions: ["We found FieldKit Stations. Choose the station you want to connect to."],
        button: "Next",
        images: [],
        altOption: "Don't see your station? Try again.",
    },
    testConnection: {
        testingConnection: true,
        proceed: "selectStation",
    },
    selectSettings: {
        selectSettings: true,
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
