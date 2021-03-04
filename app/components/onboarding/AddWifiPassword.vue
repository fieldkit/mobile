<template>
    <Page class="page">
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />
        <GridLayout rows="*,140">
            <ScrollView :row="0">
                <GridLayout rows="auto,auto,auto,auto" columns="*" @tap="hideKeyboard">
                    <ConnectionStatusHeader row="0" :connected="currentStation.connected" />

                    <StackLayout row="1" class="text-center m-b-30">
                        <Label :text="_L('yourWifi')" textWrap="true" class="size-18 m-b-10" />
                        <Label :text="ssid" textWrap="true" class="size-16" />
                    </StackLayout>

                    <StackLayout row="3" class="p-20">
                        <Label :text="_L('networkPasswordHint')" />
                        <LabeledTextField class="input" v-model="password" :secure="true" :canShow="true" />
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('next')" :isEnabled="canAdd && !busy" @tap="addNetwork" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { _T } from "@/lib";
import { isAndroid, Utils } from "@nativescript/core";
import { ActionTypes, AddStationNetworkAction, LegacyStation } from "@/store";
import { routes, fullRoutes } from "@/routes";

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
            console.log("networks", networks);
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
                []
            );
            await this.$s.dispatch(action).then(
                () => {
                    return this.$navigateTo(routes.onboarding.completeSettings, {
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
            await this.$navigateTo(fullRoutes.tabbed);
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
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
