<template>
    <Page>
        <PlatformHeader :title="_L('wifiNetwork')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*">
                    <StackLayout class="m-x-10">
                        <ConnectionStatusHeader :connected="station.connected" />
                        <WrapLayout orientation="horizontal" class="networks-container">
                            <Label :text="_L('savedNetworks')" class="size-20" width="100%" />
                            <Label :text="_L('noSavedNetworks')" class="size-16 m-t-10" v-if="networks.length == 0" />
                            <GridLayout rows="auto" columns="0,*,30" v-for="n in networks" :key="n.ssid" class="m-10">
                                <Label row="0" col="1" class="m-t-5 m-l-5" :text="n.ssid" />
                                <Image
                                    row="0"
                                    col="2"
                                    src="~/images/Icon_Close.png"
                                    width="17"
                                    @tap="(ev) => removeNetwork(n)"
                                    v-if="station.connected"
                                />
                            </GridLayout>
                        </WrapLayout>

                        <StackLayout v-show="networks.length == maximumNetworks" class="m-t-20 m-x-10 gray-bkgd">
                            <Label :text="_L('maxTwoNetworksWarning')" textWrap="true" />
                        </StackLayout>

                        <GridLayout
                            v-if="!addingNetwork && station.connected"
                            rows="auto"
                            columns="10*,90*"
                            @tap="showNetworkForm"
                            :class="'m-t-20 ' + (networks.length == maximumNetworks ? 'disabled' : '')"
                        >
                            <Image col="0" src="~/images/Icon_Add_Button.png" width="20" />
                            <Label col="1" :text="_L('addNetwork')" class="size-16" />
                        </GridLayout>

                        <StackLayout v-show="addingNetwork" class="m-t-20">
                            <TextField
                                class="size-18 p-x-20 m-t-20 input"
                                :hint="_L('networkNameHint')"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="form.ssid"
                            />

                            <GridLayout rows="auto" columns="*,42" class="input m-t-20">
                                <Label
                                    row="0"
                                    colSpan="2"
                                    :text="_L('networkPasswordHint')"
                                    class="size-18 hint"
                                    :opacity="form.password.length == 0 ? 1 : 0"
                                />
                                <TextField
                                    row="0"
                                    col="0"
                                    class="size-18 no-border-input"
                                    :secure="hidePassword"
                                    ref="password"
                                    v-model="form.password"
                                />
                                <Label
                                    row="0"
                                    col="1"
                                    :text="hidePassword ? _L('show') : _L('hide')"
                                    class="size-16"
                                    verticalAlignment="middle"
                                    :opacity="form.password.length > 0 ? 1 : 0"
                                    @tap="togglePassword"
                                />
                            </GridLayout>
                        </StackLayout>
                        <StackLayout class="p-b-20"></StackLayout>

                        <Button
                            v-show="addingNetwork"
                            class="btn btn-primary btn-padded"
                            :text="_L('save')"
                            :isEnabled="station.connected"
                            @tap="addNetwork"
                        />

                        <ActivityIndicator :busy="busy" row="0" />

                        <ConnectionNote :station="station" />

                        <!--
                        <StackLayout class="section-border">
                            <Label :text="wifiUploadText" textWrap="true" lineHeight="4" class="size-18 m-x-15" />
                            <Button
                                class="btn btn-primary btn-padded"
                                :text="wifiUploadButton"
                                :isEnabled="station.connected"
                                @tap="uploadOverWifi"
                            />
                        </StackLayout>
						-->
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { AvailableStation, NetworkInfo, AddStationNetworkAction, RemoveStationNetworkAction } from "@/store";
import { Dialogs } from "@nativescript/core";
import * as animations from "@/components/animations";
import SharedComponents from "@/components/shared";
import ConnectionNote from "./StationSettingsConnectionNote.vue";
import WiFi from "./StationSettingsWiFi.vue";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

export default Vue.extend({
    data(): {
        addingNetwork: boolean;
        hidePassword: boolean;
        busy: boolean;
        form: {
            ssid: string;
            password: string;
        };
    } {
        return {
            form: {
                ssid: "",
                password: "",
            },
            busy: false,
            addingNetwork: false,
            hidePassword: true,
        };
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    components: {
        ...SharedComponents,
        WiFi,
        ConnectionNote,
        ConnectionStatusHeader,
    },
    computed: {
        maximumNetworks(): number {
            return 2;
        },
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
        networks(): NetworkInfo[] {
            return this.station.networks;
        },
    },
    methods: {
        async goBack(ev: Event): Promise<void> {
            await Promise.all([
                animations.pressed(ev),
                this.$navigateTo(WiFi, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        showNetworkForm(): void {
            if (this.networks.length < this.maximumNetworks) {
                this.addingNetwork = true;
            }
        },
        async addNetwork(): Promise<void> {
            this.addingNetwork = false;
            const adding = _.clone(this.form);
            this.form = {
                ssid: "",
                password: "",
            };
            this.busy = true;
            try {
                await this.$s.dispatch(new AddStationNetworkAction(this.station.deviceId, adding, this.station.networks));
            } finally {
                this.busy = false;
            }
        },
        async removeNetwork(network: NetworkInfo): Promise<void> {
            await Dialogs.confirm({
                title: _L("areYouSureRemoveNetwork"),
                okButtonText: _L("yes"),
                cancelButtonText: _L("cancel"),
            }).then((confirmed) => {
                if (confirmed) {
                    this.busy = true;
                    return this.$s
                        .dispatch(new RemoveStationNetworkAction(this.station.deviceId, network, this.station.networks))
                        .finally(() => {
                            this.busy = false;
                        });
                }
                return Promise.resolve();
            });
        },
        togglePassword(): void {
            this.hidePassword = !this.hidePassword;
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
