<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="80,*,70">
            <StackLayout row="0" class="p-t-10">
                <ScreenHeader :title="_L('wifiNetwork')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                <StackLayout class="p-b-10"></StackLayout>
            </StackLayout>
            <ScrollView row="1">
                <GridLayout rows="*" columns="*">
                    <!-- add/remove networks -->
                    <StackLayout class="m-x-10">
                        <!-- known wifi networks -->
                        <WrapLayout orientation="horizontal" class="networks-container">
                            <Label :text="_L('savedNetworks')" class="size-20" width="100%"></Label>
                            <Label :text="_L('noSavedNetworks')" class="size-16 m-t-10" v-if="networks.length == 0"></Label>
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
                            <Label :text="_L('maxTwoNetworksWarning')" textWrap="true" />
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
                                :hint="_L('networkNameHint')"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="newNetwork.ssid"
                            ></TextField>

                            <!-- password -->
                            <GridLayout rows="auto" columns="*,42" class="input m-t-20">
                                <Label
                                    row="0"
                                    colSpan="2"
                                    :text="_L('networkPasswordHint')"
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
                        <Button
                            v-show="addingNetwork"
                            class="btn btn-primary btn-padded"
                            :text="_L('save')"
                            :isEnabled="station.connected"
                            @tap="addNetwork"
                        ></Button>

                        <ConnectionNote :station="station" />

                        <StackLayout class="section-border">
                            <Label :text="wifiUploadText" textWrap="true" lineHeight="4" class="size-18 m-x-15" />
                            <Button
                                class="btn btn-primary btn-padded"
                                :text="wifiUploadButton"
                                :isEnabled="station.connected"
                                @tap="uploadOverWifi"
                            />
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
import ConnectionNote from "./StationSettingsConnectionNote";

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
            passwordVisibility: _L("show"),
            wifiUpload: false,
            wifiUploadText: "",
            wifiUploadButton: "",
        };
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
        station: {
            required: true,
            type: Object,
        },
    },
    components: {
        ScreenHeader,
        ScreenFooter,
        WiFi,
        ConnectionNote,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            dbInterface.getConfig().then((config) => {
                this.transmissionUrl = config[0].ingestionUri;
            });

            let deviceStatus = this.station.statusJson;
            if (deviceStatus && deviceStatus.networkSettings) {
                this.networks = deviceStatus.networkSettings.networks.map((n) => {
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
                    stationId: this.stationId,
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
                queryStation.uploadViaApp(this.station.url).then((result) => {
                    alert({
                        title: _L("done"),
                        message: _L("uploadConfigUpdated"),
                        okButtonText: _L("ok"),
                    });
                    this.setWifiUploadStatus(result);
                });
            } else {
                this.$portalInterface
                    .getTransmissionToken()
                    .then((result) => {
                        queryStation.uploadOverWifi(this.station.url, this.transmissionUrl, result.token).then((result) => {
                            this.setWifiUploadStatus(result);
                            alert({
                                title: _L("done"),
                                message: _L("uploadConfigUpdated"),
                                okButtonText: _L("ok"),
                            });
                        });
                    })
                    .catch((e) => {
                        onlineStatus.isOnline().then((online) => {
                            if (online) {
                                alert({
                                    title: _L("unableToUpdate"),
                                    message: _L("pleaseLogin"),
                                    okButtonText: _L("ok"),
                                });
                            } else {
                                alert({
                                    title: _L("unableToUpdate"),
                                    message: _L("noteNeedInternet"),
                                    okButtonText: _L("ok"),
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
                this.wifiUploadText = _L("configuredToUploadDirectly");
                this.wifiUploadButton = _L("uploadViaApp");
            } else {
                this.wifiUpload = false;
                this.wifiUploadText = _L("noteUploadDirectlyOption");
                this.wifiUploadButton = _L("uploadOverWifi");
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
            let index = this.networks.findIndex((n) => {
                return n.ssid == network.ssid;
            });
            if (index > -1) {
                // replace if it's already present
                this.networks[index].password = network.password;
            } else {
                // otherwise add it
                this.networks.push(network);
            }

            queryStation.sendNetworkSettings(this.station.url, this.networks).then((result) => {
                this.networks = result.networkSettings.networks;
                // in order to match in the interim, must edit station.statusJson
                this.deviceStatus.networkSettings = result.networkSettings;
                this.station.statusJson = this.deviceStatus;
                this.goBack();
            });
        },

        removeNetwork(event) {
            dialogs
                .confirm({
                    title: _L("areYouSureRemoveNetwork"),
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel"),
                })
                .then((result) => {
                    if (result) {
                        let ssid = event.object.dataSsid;
                        let index = this.networks.findIndex((n) => {
                            return n.ssid == ssid;
                        });
                        if (index > -1) {
                            this.networks.splice(index, 1);
                        }
                        queryStation.sendNetworkSettings(this.station.url, this.networks).then((result) => {
                            this.networks = result.networkSettings.networks;
                            // in order to match in the interim, must edit station.statusJson
                            this.deviceStatus.networkSettings = result.networkSettings;
                            this.station.statusJson = this.deviceStatus;
                        });
                    }
                });
        },

        useNetwork(event) {
            const network = this.networks.find((n) => {
                return n.ssid == event.object.text;
            });
            this.newNetwork.ssid = network.ssid;
            this.newNetwork.password = network.password;
        },

        toggleChoice(radioOption) {
            this.networks.forEach((n) => {
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
            this.passwordVisibility = this.hidePassword ? _L("show") : _L("hide");
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
