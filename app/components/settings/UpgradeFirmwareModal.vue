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
import { AvailableStation, Station, UpgradeStatus, UpgradeInfo, UpgradeStationFirmwareAction } from "@/store";

export default Vue.extend({
    data(): {} {
        return {};
    },
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
        station(): Station {
            return this.$store.getters.stationsById[this.stationId];
        },
        upgrade(): UpgradeInfo {
            return this.$store.state.firmware.status[this.stationId] || {};
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
            /*
            if (this.downloadOnly) {
                console.log("downloading only");
                return this.$services
                    .StationFirmware()
                    .downloadFirmware(updateProgress, true)
                    .then((status) => {
                        console.log("status", status);
                        this.done = true;
                    })
                    .catch((err) => {
                        this.done = true;
                        this.error = true;
                        console.log("error", err, err.stack);
                    });
            }
			*/

            const availableStations: { [index: number]: AvailableStation } = _.keyBy(this.$store.getters.availableStations, (s) => s.id);
            const station = availableStations[this.stationId];

            if (!station) throw new Error(`firmware-modal: no such station`);
            if (!station.id) throw new Error(`firmware-modal: no station id`);
            if (!station.url) throw new Error(`firmware-modal: no station url`);

            return this.$store.dispatch(new UpgradeStationFirmwareAction(station.id, station.url));
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
