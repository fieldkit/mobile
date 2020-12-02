<template>
    <Page>
        <PlatformHeader :title="_L('endDeployment')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />

        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
                    <GridLayout rows="*" columns="*">
                        <StackLayout row="0">
                            <StackLayout class="m-x-20 m-t-20" v-if="deployed">
                                <Label :text="_L('mustBeConnectedToStop')" class="size-18 m-y-5" lineHeight="4" textWrap="true" />
                                <StackLayout class="m-t-10" />
                                <Button
                                    class="btn btn-primary btn-padded full-width"
                                    :text="_L('stopRecording')"
                                    :isEnabled="station.connected"
                                    @tap="stopRecording"
                                ></Button>
                            </StackLayout>
                            <StackLayout v-else class="m-20">
                                <Label :text="station.name + ' ' + _L('notCurrentlyRecording')" textWrap="true" />
                            </StackLayout>
                        </StackLayout>
                    </GridLayout>
                </StackLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { Dialogs } from "@nativescript/core";
import routes from "../../routes";
import SharedComponents from "@/components/shared";
import * as animations from "@/components/animations";
import { AvailableStation, ActionTypes } from "@/store";

export default Vue.extend({
    data() {
        return {};
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    components: {
        ...SharedComponents,
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
        deployed(): boolean {
            return this.$s.getters.availableStationsById[this.stationId].deployStartTime !== null;
        },
    },
    methods: {
        async goBack(ev: Event): Promise<void> {
            await Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationSettings, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        async stopRecording(ev: Event): Promise<void> {
            await Dialogs.confirm({
                title: _L("areYouSureStopRecording"),
                okButtonText: _L("yes"),
                cancelButtonText: _L("cancel"),
            }).then(async (yes) => {
                if (yes) {
                    await this.$s.dispatch(ActionTypes.END_STATION_DEPLOYMENT, { deviceId: this.station.deviceId });
                }
            });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.full-width {
    width: 100%;
    margin-bottom: 10;
}
</style>
