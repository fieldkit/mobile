<template>
    <Page class="page">
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />

        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="currentStation.connected" />

            <SkipLayout row="1" :buttonLabel="_L('next')" :buttonEnabled="canAdd && !busy" @button="addNetwork" :scrollable="true">
                <GridLayout rows="auto,auto,auto" columns="*" @tap="hideKeyboard">
                    <StackLayout row="0" class="text-center m-b-30">
                        <Label :text="_L('yourWifi')" textWrap="true" class="size-18 m-b-10" />
                        <Label :text="ssid" textWrap="true" class="size-16" />
                        <Label :text="_L('onboarding.network.wifi.band')" textWrap="true" class="size-12" />
                    </StackLayout>

                    <StackLayout row="1" class="p-20">
                        <Label :text="_L('networkPasswordHint')" />
                        <LabeledTextField class="input" v-model="password" :secure="true" :canShow="true" />
                    </StackLayout>

                    <StackLayout row="2" class="p-20">
                        <Label :text="_L('onboarding.network.wifi.caseSensitive')" textWrap="true" class="size-12" />
                    </StackLayout>
                </GridLayout>
            </SkipLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { isAndroid, Utils } from "@nativescript/core";
import { ActionTypes, AddStationNetworkAction, LegacyStation } from "@/store";
import { routes, fullRoutes } from "@/routes";
import { debug } from "@/lib/debugging";

import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";

export default Vue.extend({
    name: "AddWifiPassword",
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        ssid: {
            type: String,
            required: true,
        },
    },
    data(): {
        busy: boolean;
        password: string;
    } {
        return {
            busy: false,
            password: "",
        };
    },
    computed: {
        currentStation(): LegacyStation {
            return this.$s.getters.legacyStations[this.stationId];
        },
        canAdd(): boolean {
            return this.currentStation.connected && this.ssid.length > 0 && this.password.length > 0;
        },
    },
    async mounted(): Promise<void> {
        await this.$s.dispatch(ActionTypes.SCAN_STATION_NETWORKS, { deviceId: this.currentStation.deviceId }).then((networks) => {
            debug.log("networks", networks);
        });
    },
    methods: {
        async addNetwork(): Promise<void> {
            this.busy = true;

            const action = new AddStationNetworkAction(
                this.currentStation.deviceId,
                {
                    ssid: this.ssid,
                    password: this.password,
                },
                this.currentStation.networks.length === 2 ? [this.currentStation.networks[1]] : this.currentStation.networks
            );
            await this.$s.dispatch(action).then(
                () => {
                    return this.$deprecatedNavigateTo(routes.onboarding.completeSettings, {
                        props: {
                            stationId: this.stationId,
                            remote: false,
                        },
                    });
                },
                () => {
                    this.busy = false;
                }
            );
        },
        async skip(): Promise<void> {
            await this.$deprecatedNavigateTo(fullRoutes.tabbed);
        },
        async onBack(): Promise<void> {
            debug.log("onBack");
            await this.$deprecatedNavigateTo(routes.onboarding.network, {
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
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.ns-ios TextField {
    margin-top: 10;
}
</style>
