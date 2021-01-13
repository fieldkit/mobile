<template>
    <Page>
        <PlatformHeader :title="_L('endDeployment')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*,70">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
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
            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { Dialogs } from "@nativescript/core";
import SharedComponents from "@/components/shared";
import { AvailableStation, ActionTypes } from "@/store";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

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
        ConnectionStatusHeader,
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
