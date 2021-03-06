<template>
    <Page>
        <PlatformHeader :title="_L('endDeployment')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected">
            <StackLayout class="m-x-20 m-t-20" v-if="deployed">
                <Label :text="_L('mustBeConnectedToStop')" class="size-18 m-y-5" lineHeight="4" textWrap="true" />
                <StackLayout class="m-t-10" />
                <Button
                    class="btn btn-primary btn-padded full-width"
                    :text="_L('stopRecording')"
                    :isEnabled="station.connected"
                    @tap="stopRecording"
                />
            </StackLayout>
            <StackLayout v-else class="m-20">
                <Label :text="station.name + ' ' + _L('notCurrentlyRecording')" textWrap="true" />
            </StackLayout>
        </StationSettingsLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { Dialogs } from "@nativescript/core";
import SharedComponents from "@/components/shared";
import { AvailableStation, ActionTypes } from "@/store";
import { _L } from "@/lib";

export default Vue.extend({
    name: "StationSettingsEndDeploy",
    components: {
        ...SharedComponents,
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
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
