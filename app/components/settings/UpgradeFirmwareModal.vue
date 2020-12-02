<template>
    <StackLayout class="modal-bkgd" @loaded="onLoaded">
        <GridLayout rows="*" columns="*" width="100%" height="100%" class="p-20 modal-container text-center">
            <StackLayout verticalAlignment="middle" class="bar-container" v-if="!status.done">
                <Label class="info" lineHeight="4" :text="_L('upgradeInProcess')" textWrap="true" v-if="!downloadOnly && !status.error" />
                <Label class="info" lineHeight="4" :text="_L('downloadingFirmware')" textWrap="true" v-if="downloadOnly" />
                <Progress :value="progress" scaleY="4" v-if="!status.error" />
            </StackLayout>

            <StackLayout verticalAlignment="middle" class="bar-container" v-if="done">
                <Label class="info" lineHeight="4" :text="_L('downloaded')" textWrap="true" v-if="downloadOnly" />
                <Label class="info" lineHeight="4" :text="_L('upgradeDone')" textWrap="true" v-if="status.success && !downloadOnly" />
                <Label
                    class="info"
                    lineHeight="4"
                    text="Please check your station to ensure that it has an SD Card."
                    textWrap="true"
                    v-if="status.sdCard"
                />
                <Label class="info" lineHeight="4" text="An unknown error occured." textWrap="true" v-if="status.error" />
                <Label class="ok-btn" :text="_L('ok')" verticalAlignment="middle" @tap="onClose()" />
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>
<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { AvailableStation, UpgradeStatus, UpgradeInfo, UpgradeStationFirmwareAction } from "@/store";

export default Vue.extend({
    props: {
        stationId: {
            required: true,
            type: Number,
        },
        downloadOnly: {
            required: true,
            type: Boolean,
        },
    },
    computed: {
        done(): boolean {
            return this.status.done || false;
        },
        error(): boolean {
            return this.status.error || false;
        },
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
        upgrade(): UpgradeInfo {
            return this.$s.state.firmware.status[this.stationId] || {};
        },
        status(): UpgradeStatus {
            return this.upgrade?.status || {};
        },
        progress(): number {
            return this.upgrade?.progress?.progress || 0;
        },
    },
    methods: {
        onLoaded(): Promise<void> {
            if (!this.station) throw new Error(`firmware-modal: no such station`);
            if (!this.station.id) throw new Error(`firmware-modal: no station id`);
            if (!this.station.url) throw new Error(`firmware-modal: no station url`);
            return this.$s.dispatch(new UpgradeStationFirmwareAction(this.station.id, this.station.url));
        },
        onClose(): void {
            console.log("closing", this.$modal);
            this.$modal.close({ error: this.error });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.modal-bkgd {
    background-color: gray;
}
.modal-container {
    background-color: white;
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 4;
}
.info {
    color: $fk-primary-black;
    margin: 20;
}
.ok-btn {
    color: $fk-primary-red;
    font-weight: bold;
}
.bar-container {
    margin: 20;
}
</style>
