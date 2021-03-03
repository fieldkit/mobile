<template>
    <Page class="page">
        <PlatformHeader :title="_L('connectStation')" subtitle="Add WiFi" :canNavigateSettings="false" />
        <GridLayout rows="*,140">
            <ScrollView :row="0">
                <GridLayout rows="auto,auto,auto,auto" columns="*" @tap="hideKeyboard">
                    <ConnectionStatusHeader row="0" :connected="currentStation.connected" />

                    <StackLayout row="1">
                        <Label :text="_L('wifiStep1')" textWrap="true" class="wifi-help" />
                        <Label :text="_L('wifiStep2')" textWrap="true" class="wifi-help" />
                    </StackLayout>

                    <StackLayout row="2" class="field-container">
                        <Label text="SSID" />
                        <TextField class="input" v-model="form.ssid" autocorrect="false" autocapitalizationType="none" />
                    </StackLayout>

                    <StackLayout row="3" class="field-container">
                        <Label text="Password" />
                        <TextField class="input" v-model="form.password" autocorrect="false" autocapitalizationType="none" secure="true" />
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('next')" :isEnabled="canAdd && !busy" @tap="addNetwork" />
                <Label :text="_L('skipStep')" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { routes } from "@/routes";
import { _T } from "@/lib";
import { isAndroid, Utils } from "@nativescript/core";
import { ActionTypes, AddStationNetworkAction, LegacyStation } from "@/store";

import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";

export default Vue.extend({
    name: "AddWifi",
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
        form: {
            ssid: string;
            password: string;
        };
    } {
        return {
            busy: false,
            form: {
                ssid: "",
                password: "",
            },
        };
    },
    computed: {
        currentStation(): LegacyStation {
            return this.$s.getters.legacyStations[this.stationId];
        },
        canAdd(): boolean {
            return this.currentStation.connected && this.form.ssid.length > 0 && this.form.password.length > 0;
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
                    ssid: this.form.ssid,
                    password: this.form.password,
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
            await this.$navigateTo(routes.tabbed, {
                frame: "outer-frame",
                clearHistory: true,
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
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.small {
    width: 50;
    margin: 20;
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
.field-container {
    padding: 20;
}
.wifi-help {
    margin: 20;
}
</style>
