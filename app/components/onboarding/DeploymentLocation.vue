<template>
    <Page>
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />
        <GridLayout rows="*,auto">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*">
                    <StackLayout row="0" verticalAlignment="middle">
                        <ConnectionStatusHeader :connected="currentStation.connected" />
                        <Label class="m-t-20 text-center size-18 bold" :text="_L('deploymentLocation')" textWrap="true"></Label>
                        <Label
                            class="size-16 text-center m-20 m-b-30"
                            :text="_L('deploymentLocationInstructions')"
                            lineHeight="4"
                            textWrap="true"
                        ></Label>
                        <GridLayout rows="auto" columns="*,*" class="m-t-30">
                            <StackLayout
                                row="0"
                                col="0"
                                class="m-l-20 m-r-10 bordered-container"
                                :class="selected === REMOTE_SELECTED ? 'selected' : ''"
                                @tap="select(REMOTE_SELECTED)"
                            >
                                <Image class="m-t-25" width="137" src="~/images/remote_deployment_location.png"></Image>
                                <Label
                                    class="m-t-20 m-b-10 text-center size-16 bold"
                                    :text="_L('remoteLocationTitle')"
                                    textWrap="true"
                                ></Label>
                                <Label class="m-b-20 text-center size-14" :text="_L('remoteLocationDescription')" textWrap="true"></Label>
                            </StackLayout>
                            <StackLayout
                                row="0"
                                col="1"
                                class="m-l-10 m-r-20 bordered-container"
                                :class="selected === CONNECTED_SELECTED ? 'selected' : ''"
                                @tap="select(CONNECTED_SELECTED)"
                            >
                                <Image class="m-t-12" width="85" src="~/images/connected_deployment_location.png"></Image>
                                <Label
                                    class="m-t-5 m-b-10 text-center size-16 bold"
                                    :text="_L('connectedLocationTitle')"
                                    textWrap="true"
                                ></Label>
                                <Label
                                    class="m-b-20 text-center size-14"
                                    :text="_L('connectedLocationDescription')"
                                    textWrap="true"
                                ></Label>
                            </StackLayout>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-10 m-b-24">
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

export default Vue.extend({
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
        async forward(): Promise<void> {
            if (this.selected === this.NO_SELECTION) {
                throw new Error("no selection");
            }

            await this.$navigateTo(routes.onboarding.network, {
                props: {
                    stationId: this.stationId,
                    remote: this.selected === this.REMOTE_SELECTED,
                },
            });
        },
        select(value: number): void {
            this.selected = value;
        },
        async onBack(): Promise<void> {
            console.log("onBack");
            await this.$navigateTo(routes.onboarding.rename, {
                props: {
                    stationId: this.stationId,
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
</style>
