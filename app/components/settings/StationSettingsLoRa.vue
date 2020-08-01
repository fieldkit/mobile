<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="80,*,70">
            <StackLayout row="0" class="p-t-10">
                <ScreenHeader :title="_L('longRangeNetwork')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                <StackLayout class="p-b-10"></StackLayout>
            </StackLayout>
            <ScrollView row="1">
                <GridLayout rows="*" columns="*">
                    <!-- edit LoRa -->
                    <StackLayout class="m-x-10">
                        <!-- <Label :text="_L('loraNetwork')" class="size-20"></Label> -->
                        <Label :text="_L('deviceEUI') + ': ' + lora.deviceEui" col="0" class="m-l-15 m-y-10"></Label>

                        <GridLayout rows="auto" columns="10*,90*" @tap="showLoraForm">
                            <Image col="0" src="~/images/Icon_Add_Button.png" width="20"></Image>
                            <Label col="1" :text="_L('editAppEUI')" class="size-16"></Label>
                        </GridLayout>

                        <StackLayout v-if="editingLora">
                            <GridLayout rows="auto,auto,auto,auto" columns="35*,65*">
                                <Label
                                    row="0"
                                    col="0"
                                    :text="_L('appEUI') + ': '"
                                    verticalAlignment="middle"
                                    class="text-right m-y-10"
                                ></Label>
                                <TextField
                                    row="0"
                                    col="1"
                                    class="network-input m-y-10"
                                    autocorrect="false"
                                    autocapitalizationType="none"
                                    v-model="lora.appEui"
                                    returnKeyType="next"
                                ></TextField>
                                <Label
                                    row="1"
                                    col="1"
                                    class="validation-error m-l-10"
                                    :text="_L('invalidAppEUI')"
                                    textWrap="true"
                                    :visibility="invalidEui ? 'visible' : 'collapsed'"
                                ></Label>
                                <Label
                                    row="2"
                                    col="0"
                                    :text="_L('appKey') + ': '"
                                    verticalAlignment="middle"
                                    class="text-right m-y-10"
                                ></Label>
                                <TextField
                                    row="2"
                                    col="1"
                                    class="network-input m-y-10"
                                    autocorrect="false"
                                    autocapitalizationType="none"
                                    v-model="lora.appKey"
                                    returnKeyType="done"
                                ></TextField>
                                <Label
                                    row="3"
                                    col="1"
                                    class="validation-error m-l-10"
                                    :text="_L('invalidAppKey')"
                                    textWrap="true"
                                    :visibility="invalidKey ? 'visible' : 'collapsed'"
                                ></Label>
                            </GridLayout>
                            <StackLayout class="p-b-20"></StackLayout>
                            <Button
                                class="btn btn-primary btn-padded"
                                :text="_L('save')"
                                :isEnabled="station.connected"
                                @tap="editLora"
                            ></Button>
                            <ConnectionNote :station="station" />
                            <StackLayout class="p-b-20"></StackLayout>
                        </StackLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import Services from "../../services/services";

import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";
import Networks from "./StationSettingsNetworks";
import ConnectionNote from "./StationSettingsConnectionNote";

export default Vue.extend({
    data() {
        return {
            invalidEui: false,
            invalidKey: false,
            lora: { deviceEui: "", appEui: "", appKey: "" },
            editingLora: false,
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
        Networks,
        ConnectionNote,
    },
    methods: {
        onPageLoaded(this: any, args) {
            this.page = args.object;
            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;
            let deviceStatus = this.station.statusJson;
            if (deviceStatus && deviceStatus.loraSettings) {
                let deviceEui = deviceStatus.loraSettings.deviceEui;
                if (deviceEui) {
                    this.lora.deviceEui = Buffer.from(Object.values(deviceEui)).toString("hex");
                }
            }
            this.deviceStatus = deviceStatus;
        },
        goBack(this: any, event) {
            if (event) {
                // Change background color when pressed
                let cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            this.$navigateTo(Networks, {
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
        showLoraForm(this: any, event) {
            this.editingLora = true;
        },
        checkAppEui(this: any) {
            try {
                if (this.lora.appEui.length != 16) {
                    throw Error("invalid length");
                }
                return Buffer.from(this.lora.appEui, "hex");
            } catch (error) {
                this.invalidEui = true;
                return null;
            }
        },
        checkAppKey(this: any) {
            try {
                if (this.lora.appKey.length != 32) {
                    throw Error("invalid length");
                }
                return Buffer.from(this.lora.appKey, "hex");
            } catch (error) {
                this.invalidKey = true;
                return null;
            }
        },
        editLora(this: any, event) {
            this.invalidEui = false;
            this.invalidKey = false;
            let appEui = this.checkAppEui();
            let appKey = this.checkAppKey();

            if (appEui && appKey) {
                this.editingLora = false;
                this.invalidEui = false;
                this.invalidKey = false;

                let sendableLora = {
                    appEui: appEui,
                    appKey: appKey,
                };

                Services.QueryStation()
                    .sendLoraSettings(this.station.url, sendableLora)
                    .then((result) => {
                        this.goBack();
                        // this.appEui = new Buffer.from(Object.values(result.appEui)).toString("hex");
                        // this.appKey = new Buffer.from(Object.values(result.appKey)).toString("hex");
                        // in order to match in the interim, must edit station.statusJson
                        // NOTE: appEui and appKey currently aren't sent in statusJson, so they
                        // won't be preserved after exiting this view
                        // console.log("response from station after adding", result.loraSettings)
                    });
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.network-input {
    border-bottom-color: $fk-primary-black;
    border-bottom-width: 1;
    padding: 0;
    margin-left: 8;
    margin-bottom: 8;
}

.validation-error {
    width: 100%;
    font-size: 13;
    color: $fk-tertiary-red;
}
</style>
