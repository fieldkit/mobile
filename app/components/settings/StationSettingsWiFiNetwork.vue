<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('wifiNetwork')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*">
                    <!-- add/remove networks -->
                    <StackLayout class="m-x-10">
                        <!-- known wifi networks -->
                        <WrapLayout orientation="horizontal" class="networks-container">
                            <Label :text="_L('savedNetworks')" class="size-20" width="100%"></Label>
                            <Label :text="_L('noSavedNetworks')" class="size-16 m-t-10" v-if="networks.length == 0"></Label>
                            <!-- wifi radio buttons -->
                            <GridLayout rows="auto" columns="0,*,30" v-for="n in networks" :key="n.ssid" class="m-10">
                                <Label row="0" col="1" class="m-t-5 m-l-5" :text="n.ssid"></Label>
                                <Image row="0" col="2" src="~/images/Icon_Close.png" width="17" @tap="(ev) => removeNetwork(n)" />
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

                        <ConnectionNote :station="station" :stationId="stationId" />

                        <StackLayout class="section-border">
                            <Label :text="wifiUploadText" textWrap="true" lineHeight="4" class="size-18 m-x-15" />
                            <Button
                                class="btn btn-primary btn-padded"
                                :text="wifiUploadButton"
                                :isEnabled="station.connected"
                                @tap="uploadOverWifi"
                            />
                        </StackLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import Services from "../../services/services";
import * as animations from "@/components/animations";

import SharedComponents from "@/components/shared";
import WiFi from "./StationSettingsWiFi.vue";
import ConnectionNote from "./StationSettingsConnectionNote.vue";

import * as dialogs from "tns-core-modules/ui/dialogs";

export default Vue.extend({
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
        ...SharedComponents,
        WiFi,
        ConnectionNote,
    },
    methods: {
        onPageLoaded(this: any, args) {
            this.page = args.object;

            const deviceStatus = this.station.statusJson;
            if (deviceStatus && deviceStatus.networkSettings) {
                this.networks = deviceStatus.networkSettings.networks.map((n) => {
                    n.selected = false;
                    return n;
                });
            }
            this.deviceStatus = deviceStatus;
            this.setWifiUploadStatus(deviceStatus);
        },
        selectFromMenu(this: any, ev: any) {
            return animations.pressed(ev);
        },
        goBack(this: any, ev: any) {
            return Promise.all([
                animations.pressed(ev),
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
                }),
            ]);
        },
        uploadOverWifi(this: any) {
            if (this.wifiUpload) {
                return Services.QueryStation()
                    .uploadViaApp(this.station.url)
                    .then((result) => {
                        return this.setWifiUploadStatus(result).then(() => {
                            return alert({
                                title: _L("done"),
                                message: _L("uploadConfigUpdated"),
                                okButtonText: _L("ok"),
                            });
                        });
                    });
            } else {
                return Services.PortalInterface()
                    .getTransmissionToken()
                    .then((upload) => {
                        return Services.QueryStation()
                            .uploadOverWifi(this.station.url, upload.url, upload.token)
                            .then((result) => {
                                return this.setWifiUploadStatus(result).then(() => {
                                    return alert({
                                        title: _L("done"),
                                        message: _L("uploadConfigUpdated"),
                                        okButtonText: _L("ok"),
                                    });
                                });
                            });
                    })
                    .catch((e) => {
                        console.log(`error: ${e}`);
                        return Promise.resolve(true)
                            .then((online) => {
                                if (online) {
                                    return alert({
                                        title: _L("unableToUpdate"),
                                        message: _L("pleaseLogin"),
                                        okButtonText: _L("ok"),
                                    });
                                } else {
                                    return alert({
                                        title: _L("unableToUpdate"),
                                        message: _L("noteNeedInternet"),
                                        okButtonText: _L("ok"),
                                    });
                                }
                            });
                    });
            }
        },
        setWifiUploadStatus(this: any, status) {
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
            return Promise.resolve();
        },
        showNetworkForm(this: any, event) {
            if (this.networks.length == this.maxNetworks) {
                return;
            }
            this.addingNetwork = true;
        },
        addNetwork(this: any, event) {
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

            Services.QueryStation()
                .sendNetworkSettings(this.station.url, this.networks)
                .then((result) => {
                    this.networks = result.networkSettings.networks;
                    // in order to match in the interim, must edit station.statusJson
                    this.deviceStatus.networkSettings = result.networkSettings;
                    this.station.statusJson = this.deviceStatus;
                    this.goBack();
                });
        },
        removeNetwork(this: any, network: { ssid: string }) {
            return dialogs
                .confirm({
                    title: _L("areYouSureRemoveNetwork"),
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel"),
                })
                .then((result) => {
                    if (result) {
                        const index = this.networks.findIndex((n) => {
                            return n.ssid == network.ssid;
                        });
                        if (index > -1) {
                            this.networks.splice(index, 1);
                        }
                        return Services.QueryStation()
                            .sendNetworkSettings(this.station.url, this.networks)
                            .then((result) => {
                                this.networks = result.networkSettings.networks;
                                // in order to match in the interim, must edit station.statusJson
                                this.deviceStatus.networkSettings = result.networkSettings;
                                this.station.statusJson = this.deviceStatus;
                            });
                    }
                });
        },
        useNetwork(this: any, event) {
            const network = this.networks.find((n) => {
                return n.ssid == event.object.text;
            });
            this.newNetwork.ssid = network.ssid;
            this.newNetwork.password = network.password;
        },
        togglePassword(this: any) {
            this.hidePassword = !this.hidePassword;
            this.passwordVisibility = this.hidePassword ? _L("show") : _L("hide");
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

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
