<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('chooseWifiSettings')" :canNavigateSettings="false" />

        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="currentStation.connected" />

            <SkipLayout
                row="1"
                :buttonLabel="_L('next')"
                :buttonEnabled="currentStation.connected && selected !== NO_SELECTION"
                @button="forward"
                :skipLabel="_L('skipStep')"
                @skip="skip"
                :scrollable="true"
            >
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
            </SkipLayout>
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
                // await this.$deprecatedNavigateTo(routes.onboarding.dataSync, {
                await this.$deprecatedNavigateTo(routes.onboarding.completeSettings, {
                    props: {
                        stationId: this.stationId,
                        remote: true,
                    },
                });
            }

            if (this.selected === this.CONNECTED_SELECTED) {
                await this.$deprecatedNavigateTo(routes.onboarding.addWifiName, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
        },
        async skip(): Promise<void> {
            await this.$deprecatedNavigateTo(routes.onboarding.completeSettings, {
                props: {
                    stationId: this.stationId,
                    remote: false,
                },
            });
        },
        select(value: number): void {
            this.selected = value;
        },
        async onBack(): Promise<void> {
            await this.$deprecatedNavigateTo(routes.onboarding.deploymentLocation, {
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
