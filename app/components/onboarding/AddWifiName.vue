<template>
    <Page class="page">
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />
        <GridLayout rows="*,140">
            <ScrollView :row="0">
                <StackLayout>
                    <GridLayout rows="auto,auto,auto,auto" columns="*" @tap="hideKeyboard">
                        <ConnectionStatusHeader row="0" :connected="currentStation.connected" />

                        <StackLayout row="1" class="text-center m-b-30">
                            <Label :text="_L('wifiNameTitle')" textWrap="true" class="size-18 m-b-10 bold" />
                            <Label :text="_L('wifiNameBig')" textWrap="true" class="size-16 m-b-10" />
                            <Label :text="_L('wifiNameSmall')" textWrap="true" class="size-12" />
                        </StackLayout>

                        <StackLayout row="2" class="p-20">
                            <Label :text="_L('networkNameHint')" />
                            <TextField class="input" v-model="ssid" autocorrect="false" autocapitalizationType="none" />
                        </StackLayout>

                        <StackLayout row="3" class="p-20">
                            <Label :text="_L('savedNetworks')" class="size-16 bold" />
                            <Label v-if="storedNetworks.length == 0" :text="_L('noSavedNetworks')" class="size-14" />
                        </StackLayout>
                    </GridLayout>
                    <GridLayout columns="30,*" class="p-t-10 m-l-20" v-for="(networkName, i) in storedNetworks" v-bind:key="i">
                        <CheckBox
                            row="0"
                            col="0"
                            :class="isIOS ? 'm-l-5' : ''"
                            :checked="ssid === networkName"
                            fillColor="#2c3e50"
                            onCheckColor="#2c3e50"
                            onTintColor="#d8dce0"
                            fontSize="15"
                            boxType="circle"
                            @tap="selectName(networkName)"
                        />
                        <Label row="0" col="1" class="size-16 m-t-5 m-l-5" :text="networkName"></Label>
                    </GridLayout>
                </StackLayout>
            </ScrollView>

            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('next')" :isEnabled="canAdd && !busy" @tap="next" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { routes } from "@/routes";
import { isAndroid, isIOS, Utils } from "@nativescript/core";
import { ActionTypes, LegacyStation } from "@/store";

import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";

export default Vue.extend({
    name: "AddWifiName",
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data(): {
        busy: boolean;
        ssid: string;
    } {
        return {
            busy: false,
            ssid: "",
        };
    },
    computed: {
        currentStation(): LegacyStation {
            return this.$s.getters.legacyStations[this.stationId];
        },
        canAdd(): boolean {
            return this.currentStation.connected && this.ssid.length > 0;
        },
        storedNetworks(): any {
            return this.$s.state.phone.storedNetworks;
        },
        isIOS(): boolean {
            return isIOS;
        },
    },
    async mounted(): Promise<void> {
        await this.$s.dispatch(ActionTypes.LOAD_STORED_NETWORKS);

        await this.$s.dispatch(ActionTypes.SCAN_STATION_NETWORKS, { deviceId: this.currentStation.deviceId }).then((networks) => {
            console.log("networks", networks);
        });
    },
    methods: {
        async next(): Promise<void> {
            this.busy = true;

            if (this.ssid && !this.storedNetworks?.find((item) => item.name === this.ssid)) {
                await this.$s.dispatch(ActionTypes.ADD_STORED_NETWORKS, this.ssid);
            }

            this.busy = false;

            await this.$navigateTo(routes.onboarding.addWifiPassword, {
                props: {
                    stationId: this.stationId,
                    ssid: this.ssid,
                },
            });
        },
        async onBack(): Promise<void> {
            console.log("onBack");
            await this.$navigateTo(routes.onboarding.network, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        hideKeyboard(): void {
            if (isAndroid) {
                Utils.ad.dismissSoftInput();
            }
        },
        selectName(name): void {
            this.ssid = name;
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
