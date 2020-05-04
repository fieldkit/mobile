<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="80,*,70">
            <StackLayout row="0" class="p-t-10">
                <ScreenHeader title="WiFi Network" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                <StackLayout class="p-b-10"></StackLayout>
            </StackLayout>
            <ScrollView row="1">
                <GridLayout rows="*" columns="*">
                    <!-- add/remove networks -->
                    <StackLayout class="m-x-10">
                        <!-- known wifi networks -->
                        <WrapLayout orientation="horizontal" class="networks-container">
                            <Label text="Saved WiFi Networks" class="size-20" width="100%"></Label>
                            <Label text="No saved networks" class="size-16 m-t-10" v-if="networks.length == 0"></Label>
                            <!-- wifi radio buttons -->
                            <GridLayout rows="auto" columns="0,*,30" v-for="n in networks" :key="n.ssid" class="m-10">
                                <!-- <check-box
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
                                /> -->
                                <Label row="0" col="1" class="m-t-5 m-l-5" :text="n.ssid"></Label>
                                <Image
                                    row="0"
                                    col="2"
                                    src="~/images/Icon_Close.png"
                                    width="17"
                                    :dataSsid="n.ssid"
                                    @tap="removeNetwork"
                                ></Image>
                            </GridLayout>
                            <!-- end radio buttons -->
                        </WrapLayout>

                        <StackLayout v-show="networks.length == maxNetworks" class="m-t-20 m-x-10 gray-bkgd">
                            <Label
                                text="A maximum of two WiFi networks can be saved. Please remove one if you would like to add another."
                                textWrap="true"
                            />
                        </StackLayout>

                        <GridLayout
                            v-if="!addingNetwork"
                            rows="auto"
                            columns="10*,90*"
                            @tap="showNetworkForm"
                            :class="'m-t-20 ' + (networks.length == maxNetworks ? 'disabled' : '')"
                        >
                            <Image col="0" src="~/images/Icon_Add_Button.png" width="20"></Image>
                            <Label col="1" :text="_L('addNetwork')" class="size-16"></Label>
                        </GridLayout>

                        <StackLayout v-show="addingNetwork" class="m-t-20">
                            <!-- ssid -->
                            <TextField
                                class="size-18 p-x-20 m-t-20 input"
                                hint="Enter WiFi network name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="newNetwork.ssid"
                            ></TextField>

                            <!-- password -->
                            <GridLayout rows="auto" columns="*,42" class="input m-t-20">
                                <Label
                                    row="0"
                                    colSpan="2"
                                    text="Enter network password"
                                    class="size-18 hint"
                                    :opacity="newNetwork.password.length == 0 ? 1 : 0"
                                />
                                <TextField
                                    row="0"
                                    col="0"
                                    class="size-18 no-border-input"
                                    :secure="hidePassword"
                                    ref="password"
                                    v-model="newNetwork.password"
                                ></TextField>
                                <Label
                                    row="0"
                                    col="1"
                                    :text="passwordVisibility"
                                    class="size-16"
                                    verticalAlignment="middle"
                                    :opacity="newNetwork.password.length > 0 ? 1 : 0"
                                    @tap="togglePassword"
                                />
                            </GridLayout>
                        </StackLayout>
                        <StackLayout class="p-b-20"></StackLayout>
                        <!-- make this visible all the time again when radio buttons are reactivated -->
                        <Button v-show="addingNetwork" class="btn btn-primary btn-padded" :text="_L('save')" @tap="addNetwork"></Button>

                        <StackLayout class="section-border">
                            <Label :text="wifiUploadText" textWrap="true" lineHeight="4" class="size-18 m-x-15" />
                            <Button class="btn btn-primary btn-padded" :text="wifiUploadButton" @tap="uploadOverWifi" />
                        </StackLayout>

                        <StackLayout class="p-b-20"></StackLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import * as dialogs from "tns-core-modules/ui/dialogs";
import routes from "../../routes";
import Services from "../../services/services";

import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";
import WiFi from "./StationSettingsWiFi";

const dbInterface = Services.Database();
const queryStation = Services.QueryStation();
const onlineStatus = Services.OnlineStatus();

export default {
    data() {
        return {
            maxNetworks: 2,
            networks: [],
            newNetwork: { ssid: "", password: "" },
            addingNetwork: false,
            hidePassword: true,
            passwordVisibility: "Show",
            wifiUpload: false,
            wifiUploadText: "",
            wifiUploadButton: "",
        };
    },
    props: ["station"],
    components: {
        ScreenHeader,
        ScreenFooter,
        WiFi,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            dbInterface.getConfig().then(config => {
                this.transmissionUrl = config[0].ingestionUri;
            });

            let deviceStatus = this.station.statusJson;
            if (deviceStatus && deviceStatus.networkSettings) {
                this.networks = deviceStatus.networkSettings.networks.map(n => {
                    n.selected = false;
                    return n;
                });
            }
            this.deviceStatus = deviceStatus;
            this.setWifiUploadStatus(deviceStatus);
        },

        selectFromMenu(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);
        },

        goBack(event) {
            if (event) {
                // Change background color when pressed
                let cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            this.$navigateTo(WiFi, {
                props: {
                    station: this.station,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
        },

        uploadOverWifi() {
            if (this.wifiUpload) {
                queryStation.uploadViaApp(this.station.url).then(result => {
                    alert({
                        title: "Done",
                        message: "Upload configuration has been updated.",
                        okButtonText: "OK",
                    });
                    this.setWifiUploadStatus(result);
                });
            } else {
                this.$portalInterface
                    .getTransmissionToken()
                    .then(result => {
                        queryStation.uploadOverWifi(this.station.url, this.transmissionUrl, result.token).then(result => {
                            this.setWifiUploadStatus(result);
                            alert({
                                title: "Done",
                                message: "Upload configuration has been updated.",
                                okButtonText: "OK",
                            });
                        });
                    })
                    .catch(e => {
                        onlineStatus.isOnline().then(online => {
                            if (online) {
                                alert({
                                    title: "Unable to update",
                                    message: "Please log in to perform this action.",
                                    okButtonText: "OK",
                                });
                            } else {
                                alert({
                                    title: "Unable to update",
                                    message: "Note: you need to be connected to the internet in order to perform this action.",
                                    okButtonText: "OK",
                                });
                            }
                        });
                    });
            }
        },

        setWifiUploadStatus(status) {
            this.deviceStatus.transmission = status.transmission;
            if (status && status.transmission && status.transmission.wifi.enabled) {
                this.wifiUpload = true;
                this.wifiUploadText = "Your station is currently configured to upload data directly over WiFi.";
                this.wifiUploadButton = "Upload via App";
            } else {
                this.wifiUpload = false;
                this.wifiUploadText = "If desired, you can set your station to upload data directly over WiFi.";
                this.wifiUploadButton = "Upload over WiFi";
            }
        },

        showNetworkForm(event) {
            if (this.networks.length == this.maxNetworks) {
                return;
            }
            this.addingNetwork = true;
        },

        addNetwork(event) {
            this.addingNetwork = false;
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

            queryStation.sendNetworkSettings(this.station.url, this.networks).then(result => {
                this.networks = result.networkSettings.networks;
                // in order to match in the interim, must edit station.statusJson
                this.deviceStatus.networkSettings = result.networkSettings;
                let status = JSON.stringify(this.deviceStatus);
                this.station.statusJson = status;
                this.goBack();
            });
        },

        removeNetwork(event) {
            dialogs
                .confirm({
                    title: "Are you sure you want to remove this network?",
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel"),
                })
                .then(result => {
                    if (result) {
                        let ssid = event.object.dataSsid;
                        let index = this.networks.findIndex(n => {
                            return n.ssid == ssid;
                        });
                        if (index > -1) {
                            this.networks.splice(index, 1);
                        }
                        queryStation.sendNetworkSettings(this.station.url, this.networks).then(result => {
                            this.networks = result.networkSettings.networks;
                            // in order to match in the interim, must edit station.statusJson
                            this.deviceStatus.networkSettings = result.networkSettings;
                            let status = JSON.stringify(this.deviceStatus);
                            this.station.statusJson = status;
                        });
                    }
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
                    this.newNetwork.ssid = n.ssid;
                    this.newNetwork.password = n.password;
                }
            });
        },

        togglePassword() {
            this.hidePassword = !this.hidePassword;
            this.passwordVisibility = this.hidePassword ? "Show" : "Hide";
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
// End custom common variables

// Custom styles
.disabled {
    opacity: 0.5;
}
.gray-bkgd {
    border-radius: 4;
    padding: 10;
    background-color: $fk-gray-lightest;
}
.hint {
    color: $fk-gray-light;
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
    text-align: center;
}
.validation-error {
    width: 100%;
    font-size: 13;
    color: $fk-tertiary-red;
}
.section-border {
    margin-top: 20;
    padding-top: 15;
    padding-bottom: 15;
    border-color: $fk-gray-lighter;
    border-bottom-width: 1;
    border-top-width: 1;
}
</style>
