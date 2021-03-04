<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('chooseWifiSettings')" :canNavigateSettings="false" />
        <GridLayout rows="*,140">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*">
                    <StackLayout row="0" verticalAlignment="middle">
                        <ConnectionStatusHeader :connected="currentStation.connected" />
                        <Label class="m-20 text-center" :text="_L('chooseWifiInstruction')" lineHeight="4" textWrap="true"></Label>
                        <StackLayout v-if="remote">
                            <NetworkTypeItem
                                :selected="selected === REMOTE_SELECTED"
                                :remote="true"
                                :recommended="true"
                                @tapped="select(REMOTE_SELECTED)"
                            ></NetworkTypeItem>
                            <NetworkTypeItem
                                :selected="selected === CONNECTED_SELECTED"
                                :remote="false"
                                :recommended="false"
                                @tapped="select(CONNECTED_SELECTED)"
                            ></NetworkTypeItem>
                        </StackLayout>

                        <StackLayout v-if="!remote">
                            <NetworkTypeItem
                                :selected="selected === CONNECTED_SELECTED"
                                :remote="false"
                                :recommended="true"
                                @tapped="select(CONNECTED_SELECTED)"
                            ></NetworkTypeItem>

                            <NetworkTypeItem
                                :selected="selected === REMOTE_SELECTED"
                                :remote="true"
                                :recommended="false"
                                @tapped="select(REMOTE_SELECTED)"
                            ></NetworkTypeItem>
                        </StackLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-10 m-b-25">
                <Button
                    class="btn btn-primary btn-padded m-y-10"
                    :text="_L('next')"
                    @tap="forward"
                    :isEnabled="currentStation.connected && selected !== NO_SELECTION"
                />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { routes } from "@/routes";
import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";
import { LegacyStation } from "@/store";
import NetworkTypeItem from "~/components/onboarding/NetworkTypeItem.vue";

export default Vue.extend({
    name: "Network",
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
        NetworkTypeItem,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        remote: {
            type: Boolean,
            required: true,
        },
    },
    data() {
        return {
            selected: 0,
            NO_SELECTION: 0,
            REMOTE_SELECTED: 1,
            CONNECTED_SELECTED: 2,
        };
    },
    computed: {
        currentStation(): LegacyStation {
            const station = this.$s.getters.legacyStations[this.stationId];
            if (!station) throw new Error("no station");
            return station;
        },
    },
    methods: {
        onPageLoaded(): void {
            this.selected = this.remote ? this.REMOTE_SELECTED : this.CONNECTED_SELECTED;
        },
        async forward(): Promise<void> {
            if (this.selected === this.REMOTE_SELECTED) {
                // Skipping dataSync
                await this.$navigateTo(routes.onboarding.dataSync, {
                    props: {
                        stationId: this.stationId,
                        remote: true,
                    },
                });
            }

            if (this.selected === this.CONNECTED_SELECTED) {
                await this.$navigateTo(routes.onboarding.addWifiName, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
        },
        select(value: number): void {
            this.selected = value;
        },
        async onBack(): Promise<void> {
            console.log("onBack");
            await this.$navigateTo(routes.onboarding.deploymentLocation, {
                props: {
                    stationId: this.stationId,
                    remote: this.remote,
                },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;

    &.selected {
        border-color: $fk-logo-blue;
        border-width: 3;
    }
}

.recommended {
    color: $fk-primary-blue;
    font-weight: bold;
}
</style>
