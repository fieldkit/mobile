<template>
    <Page>
        <PlatformHeader :title="_L('wifiNetwork')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected" :scrollable="false">
            <StackLayout class="m-x-10 m-t-10 settings-networks-container">
                <StackLayout>
                    <Label :text="_L('savedNetworks')" class="size-20" textWrap="true" />
                    <Label :text="_L('noSavedNetworks')" class="size-16 m-t-20" v-if="networks.length == 0" textWrap="true" />
                </StackLayout>

                <StackLayout>
                    <GridLayout rows="auto" columns="0,*,30" v-for="n in networks" :key="n.ssid" class="network-row m-t-10">
                        <Label row="0" col="1" class="m-t-5" :text="n.ssid" />

                        <StackLayout row="0" col="2" v-if="station.connected" @tap="(ev) => removeNetwork(n)">
                            <Image src="~/images/Icon_Close.png" width="17" />
                        </StackLayout>
                    </GridLayout>
                </StackLayout>

                <StackLayout v-show="networks.length >= maximumNetworks" class="m-t-20 gray-bkgd">
                    <Label :text="_L('maxTwoNetworksWarning')" textWrap="true" />
                </StackLayout>

                <GridLayout
                    v-if="networks.length < maximumNetworks && !addingNetwork && station.connected"
                    rows="auto"
                    columns="10*,90*"
                    @tap="showNetworkForm"
                    :class="'m-t-20 ' + (networks.length == maximumNetworks ? 'disabled' : '')"
                >
                    <Image col="0" src="~/images/Icon_Add_Button.png" width="20" />
                    <Label col="1" :text="_L('addNetwork')" class="size-16" />
                </GridLayout>

                <StackLayout v-show="addingNetwork" class="m-t-20">
                    <WiFiNetworkForm v-if="addingNetwork" @saved="addNetwork" />
                </StackLayout>

                <ActivityIndicator :busy="busy" row="0" />
            </StackLayout>
        </StationSettingsLayout>
    </Page>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { Dialogs } from "@nativescript/core";
import SharedComponents from "@/components/shared";
import WiFiNetworkForm from "@/components/WiFiNetworkForm.vue";
import { AvailableStation, NetworkInfo, AddStationNetworkAction, RemoveStationNetworkAction } from "@/store";
import { _L } from "@/lib";

export default Vue.extend({
    data(): {
        addingNetwork: boolean;
        busy: boolean;
    } {
        return {
            busy: false,
            addingNetwork: false,
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
        WiFiNetworkForm,
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
        showNetworkForm(): void {
            if (this.networks.length < this.maximumNetworks) {
                this.addingNetwork = true;
            }
        },
        async addNetwork(adding: { ssid: string; password: string }): Promise<void> {
            this.addingNetwork = false;
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
.network-row {
    padding: 10;
}
.settings-networks-container {
    flex-direction: column;
    justify-content: space-around;
    height: 100%;
}
</style>
