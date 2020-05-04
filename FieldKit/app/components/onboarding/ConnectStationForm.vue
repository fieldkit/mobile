<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,140">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*" verticalAlignment="middle">
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

                        <Label :text="label" class="m-y-20 size-16 text-center" textWrap="true" width="100%" />

                        <!-- edit station name -->
                        <GridLayout rows="auto" columns="*,30" class="bottom-bordered m-x-20" v-show="editingName">
                            <TextField
                                col="0"
                                textWrap="true"
                                class="size-18 no-border-input"
                                :hint="step.hint"
                                v-model="stationName"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                @blur="checkName"
                            ></TextField>
                            <Image col="1" width="17" @tap="clearName" src="~/images/Icon_Close.png"></Image>
                        </GridLayout>

                        <!-- or edit ssid -->
                        <GridLayout rows="auto,auto" columns="*" class="p-x-20">
                            <Label
                                row="0"
                                id="hidden-ssid-instruction"
                                :text="step.hint"
                                class="size-12"
                                :visibility="typing && editingSsid ? 'visible' : 'collapsed'"
                            />
                            <TextField
                                row="1"
                                :class="'size-18 input ' + lineStatus"
                                :hint="step.hint"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="newNetwork.ssid"
                                v-if="editingSsid"
                                @focus="activateLine"
                                @textChange="showSsidInstruction"
                                @blur="deactivateLine"
                            ></TextField>
                        </GridLayout>

                        <!-- or edit password -->
                        <GridLayout rows="auto,auto" columns="*,42" :opacity="editingPassword ? 1 : 0" :class="'input ' + lineStatus">
                            <Label
                                row="0"
                                col="0"
                                horizontalAlignment="left"
                                id="hidden-password-instruction"
                                :text="step.hint"
                                class="size-12"
                                :visibility="typing ? 'visible' : 'collapsed'"
                            />
                            <TextField
                                row="1"
                                col="0"
                                class="size-18 no-border-input"
                                :hint="step.hint"
                                :secure="hidePassword"
                                ref="password"
                                v-model="newNetwork.password"
                                @focus="activateLine"
                                @textChange="showPasswordInstruction"
                                @blur="deactivateLine"
                            ></TextField>
                            <Label
                                row="1"
                                col="1"
                                :text="passwordVisibility"
                                class="size-16"
                                verticalAlignment="middle"
                                @tap="togglePassword"
                            />
                        </GridLayout>

                        <!-- station name validation errors -->
                        <Label
                            class="validation-error"
                            id="no-name"
                            :text="_L('nameRequired')"
                            textWrap="true"
                            :visibility="noName ? 'visible' : 'collapsed'"
                        ></Label>
                        <Label
                            class="validation-error"
                            id="name-too-long"
                            :text="_L('nameOver40')"
                            textWrap="true"
                            :visibility="nameTooLong ? 'visible' : 'collapsed'"
                        ></Label>
                        <Label
                            class="validation-error"
                            id="name-not-printable"
                            :text="_L('nameNotPrintable')"
                            textWrap="true"
                            :visibility="nameNotPrintable ? 'visible' : 'collapsed'"
                        ></Label>

                        <!-- known wifi networks -->
                        <WrapLayout orientation="horizontal" :opacity="showNetworks ? 1 : 0" class="networks-container">
                            <Label text="Saved WiFi Networks" class="title" width="100%"></Label>
                            <Label text="No saved networks" class="size-16 m-t-10" v-if="networks.length == 0"></Label>
                            <!-- wifi radio buttons -->
                            <GridLayout rows="auto" columns="30,*" v-for="n in networks" :key="n.ssid" class="m-10">
                                <check-box
                                    row="0"
                                    col="0"
                                    :checked="n.selected"
                                    :isEnabled="!n.selected"
                                    fillColor="#2C3E50"
                                    onCheckColor="#2C3E50"
                                    onTintColor="#2C3E50"
                                    fontSize="18"
                                    boxType="circle"
                                    @checkedChange="$event.value !== n.selected && toggleChoice(n)"
                                />
                                <Label row="0" col="1" class="m-t-5 m-l-5" :text="n.ssid"></Label>
                            </GridLayout>
                            <!-- end radio buttons -->
                        </WrapLayout>
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
                <Label :text="step.altOption" class="skip" @tap="goToModules" textWrap="true" />
            </StackLayout>
            <!-- end sticky next button -->
        </GridLayout>
    </Page>
</template>

<script>
import { AnimationCurve } from "tns-core-modules/ui/enums";
import routes from "../../routes";
import { _T } from "../../utilities";
import Services from "../../services/services";
import ConnectStationCheck from "./ConnectStationCheck";
import ConnectStationModules from "./ConnectStationModules";

const queryStation = Services.QueryStation();
const stateManager = Services.StateManager();

export default {
    props: ["stepParam", "station"],
    data() {
        return {
            step: {},
            label: "",
            stationName: "",
            origName: "",
            noName: false,
            nameTooLong: false,
            nameNotPrintable: false,
            loggedIn: this.$portalInterface.isLoggedIn(),
            networks: [],
            showNetworks: false,
            hidePassword: true,
            passwordVisibility: "Show",
            newNetwork: { ssid: "", password: "" },
            editingName: false,
            editingSsid: false,
            editingPassword: false,
            typing: false,
            lineStatus: "inactive-line",
        };
    },
    components: {},
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
            this.hiddenSsidInstruction = this.page.getViewById("hidden-ssid-instruction");
            this.hiddenPasswordInstruction = this.page.getViewById("hidden-password-instruction");
            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;

            this.step = steps[this.stepParam];

            if (this.stepParam == "stationName") {
                this.editingName = true;
                this.stationName = this.station.name;
                this.origName = this.stationName;
            }

            if (this.stepParam == "ssid") {
                this.showNetworks = true;
                this.editingSsid = true;
                let deviceStatus = this.station.statusJson;
                if (deviceStatus && deviceStatus.networkSettings) {
                    this.networks = deviceStatus.networkSettings.networks.map(n => {
                        n.selected = false;
                        return n;
                    });
                }
            }
        },
        activateLine() {
            this.lineStatus = "active-line";
        },

        deactivateLine() {
            this.typing = false;
            this.lineStatus = "inactive-line";
        },

        showSsidInstruction() {
            if (!this.typing && this.newNetwork.ssid) {
                this.animateText(this.hiddenSsidInstruction);
            } else if (!this.newNetwork.ssid) {
                this.typing = false;
            }
        },

        showPasswordInstruction() {
            if (!this.typing && this.newNetwork.password) {
                this.animateText(this.hiddenPasswordInstruction);
            } else if (!this.newNetwork.password) {
                this.typing = false;
            }
        },

        animateText(element) {
            element.opacity = 0;
            element.translateX = 5;
            element.translateY = 20;
            this.typing = true;
            element.animate({
                opacity: 0.75,
                translate: { x: 0, y: 0 },
                duration: 300,
                curve: AnimationCurve.easeIn,
            });
        },

        checkName() {
            // reset these first
            this.noName = false;
            this.nameNotPrintable = false;
            this.nameTooLong = false;
            // then check
            this.noName = !this.stationName || this.stationName.length == 0;
            if (this.noName) {
                this.stationName = this.origName;
                return false;
            }
            let matches = this.stationName.match(/^[ \w~!@#$%^&*()-.']*$/);
            this.nameNotPrintable = !matches || matches.length == 0;
            this.nameTooLong = this.stationName.length > 40;
            return !this.nameTooLong && !this.nameNotPrintable;
        },

        clearName() {
            this.editingName = true;
            this.stationName = "";
        },

        saveStationName() {
            let valid = this.checkName();
            if (valid && this.origName != this.stationName) {
                this.station.name = this.stationName;
                return stateManager
                    .renameStation(this.station, this.stationName)
                    .then(() => {
                        this.origName = this.stationName;
                    })
                    .catch(error => {
                        console.error("error saving station name", error);
                    });
            } else {
                return Promise.reject();
            }
        },

        goToPassword() {
            this.step = steps["password"];
            this.showNetworks = false;
            this.editingSsid = false;
            this.editingPassword = true;
            this.label = this.newNetwork.ssid;
            if (this.newNetwork.password) {
                this.activateLine();
            }
        },

        addNetwork() {
            let network = {
                ssid: this.newNetwork.ssid,
                password: this.newNetwork.password,
            };
            let index = this.networks.findIndex(n => {
                return n.ssid == network.ssid;
            });
            if (index > -1) {
                // replace if it's already present
                this.networks[index].password = network.password;
            } else {
                // otherwise add it
                this.networks.push(network);
            }

            return queryStation.sendNetworkSettings(this.station.url, this.networks).then(result => {
                this.networks = result.networkSettings.networks.map(n => {
                    n.selected = n.ssid == this.network.ssid;
                    return n;
                });
            });
        },

        useNetwork(event) {
            const network = this.networks.find(n => {
                return n.ssid == event.object.text;
            });
            this.newNetwork.ssid = network.ssid;
            this.newNetwork.password = network.password;
        },

        toggleChoice(radioOption) {
            this.networks.forEach(n => {
                n.selected = false;
                if (n.ssid == radioOption.ssid) {
                    n.selected = true;
                    this.lineStatus = "active-line";
                    this.newNetwork.ssid = n.ssid;
                    this.newNetwork.password = n.password;
                }
            });
        },

        togglePassword() {
            this.hidePassword = !this.hidePassword;
            this.passwordVisibility = this.hidePassword ? "Show" : "Hide";
        },

        goNext() {
            this.deactivateLine();
            if (this.step.field == "stationName") {
                this.saveStationName();
            }
            if (this.step.field == "ssid") {
                this.goToPassword();
                return;
            } else if (this.step.field == "password") {
                this.addNetwork();
            }

            if (this.step.next && this.step.next == "reconnect") {
                this.$navigateTo(routes.connectStation, {
                    props: {
                        stepParam: "reconnect",
                        stationParam: this.station,
                    },
                });
            }

            if (this.step.next && this.step.next == "testConnection") {
                this.$navigateTo(ConnectStationCheck, {
                    props: {
                        stepParam: "testConnection",
                        proceed: steps[this.step.next].proceed,
                        stationParam: this.station,
                    },
                });
            }
        },

        goToModules() {
            this.$navigateTo(ConnectStationModules, {
                props: {
                    stepParam: "startCalibration",
                    stationParam: this.station,
                },
            });
        },
    },
};

const steps = {
    stationName: {
        prev: "selectSettings",
        next: "reconnect",
        skip: "startCalibration",
        title: "Change your FieldKit station name?",
        instructions: ["You can change the name or leave it the same. You can always change it later."],
        button: "Save New Name",
        images: [],
        label: "",
        field: "stationName",
        hint: "Enter a name for your station",
        altOption: "Skip this step",
    },
    reconnect: {
        prev: "stationName",
        next: "testConnection",
        title: "Reconnect to your FieldKit Station",
    },
    ssid: {
        prev: "selectSettings",
        next: "password",
        title: "Your WiFi Network",
        instructions: [
            "Enter the name of the WiFi network you would like to connect your FieldKit station to.",
            "Unfortunately, only 2.4GHz WiFi is currently supported.",
        ],
        button: "Next",
        images: [],
        label: "",
        field: "ssid",
        hint: "Enter WiFi network name",
    },
    password: {
        prev: "ssid",
        next: "testConnection",
        title: "Your WiFi Network",
        instructions: [],
        button: "Next",
        images: [],
        label: "",
        field: "password",
        hint: "Enter network password",
    },
    testConnection: {
        testingConnection: true,
        prev: "",
        next: "",
        proceed: "startCalibration",
        title: "",
        instructions: ["Connecting"],
        button: "",
        images: [],
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
// End custom common variables
// Custom styles
.networks-container {
    margin-top: 40;
    margin-left: 20;
    margin-right: 20;
}

.bottom-bordered {
    border-bottom-width: 1px;
    text-align: center;
    // iOS-only padding in app.ios.scss
}
.no-border-input {
    border-bottom-width: 1;
    border-bottom-color: white;
}

.input {
    width: 90%;
    margin-left: 20;
    margin-right: 20;
    border-bottom-width: 1px;
}
.validation-error {
    width: 100%;
    font-size: 13;
    margin-top: 5;
    color: $fk-tertiary-red;
    text-align: center;
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
.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}
#hidden-password-instruction,
#hidden-ssid-instruction {
    margin-bottom: 4;
    color: $fk-gray-hint;
}
.inactive-line {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}
.active-line {
    border-bottom-color: $fk-secondary-blue;
    border-bottom-width: 2;
}
</style>
