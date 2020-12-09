<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('longRangeNetwork')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*">
                    <!-- edit LoRa -->
                    <StackLayout class="m-x-10">
                        <ConnectionStatusHeader :connected="station.connected" />
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

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import Networks from "./StationSettingsNetworks.vue";
import ConnectionNote from "./StationSettingsConnectionNote.vue";
import { AvailableStation } from "@/store";
import * as animations from "../animations";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

export default Vue.extend({
    components: {
        ...SharedComponents,
        Networks,
        ConnectionNote,
        ConnectionStatusHeader,
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    data(): {
        invalidEui: boolean;
        invalidKey: boolean;
        editingLora: boolean;
        lora: {
            deviceEui: string;
            appEui: string;
            appKey: string;
        };
    } {
        return {
            invalidEui: false,
            invalidKey: false,
            editingLora: false,
            lora: { deviceEui: "", appEui: "", appKey: "" },
        };
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        onPageLoaded(): void {
            if (this.station.lora) {
                this.lora.deviceEui = this.station.lora.deviceEui;
            }
        },
        async goBack(ev: Event | null): Promise<void> {
            await Promise.all([
                animations.pressed(ev),
                this.$navigateTo(Networks, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        showLoraForm(): void {
            this.editingLora = true;
        },
        checkAppEui(): Buffer | null {
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
        checkAppKey(): Buffer | null {
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
        async editLora(ev: Event): Promise<void> {
            this.invalidEui = false;
            this.invalidKey = false;
            const appEui = this.checkAppEui();
            const appKey = this.checkAppKey();

            if (appEui && appKey) {
                this.editingLora = false;
                this.invalidEui = false;
                this.invalidKey = false;

                const sendableLora = {
                    appEui: appEui,
                    appKey: appKey,
                };

                const url = this.station.url;
                if (!url) throw new Error(`no nearby info`);

                await this.$services
                    .QueryStation()
                    .sendLoraSettings(url, sendableLora)
                    .then((result) => {
                        this.goBack(null);
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
