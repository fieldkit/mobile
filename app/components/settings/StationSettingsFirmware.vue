<template>
    <Page>
        <PlatformHeader :title="_L('firmware')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />

        <GridLayout rows="*,70">
            <ScrollView row="0">
                <FlexboxLayout flexDirection="column" justifyContent="space-between" class="p-t-10">
                    <StackLayout class="m-t-10 m-b-30">
                        <Label :text="_L('stationFirmwareVersion')" class="size-20 m-x-15" />
                        <Label
                            :text="_L('firmwareNumber') + ': ' + stationFirmware.simpleNumber"
                            class="size-15 m-x-15 m-b-20"
                            textWrap="true"
                            v-if="stationFirmware"
                        />
                        <Label
                            :text="_L('firmwareNumber') + ': --'"
                            class="size-15 m-x-15 m-b-20"
                            textWrap="true"
                            v-if="!stationFirmware"
                        />
                        <Label :text="_L('appFirmwareVersion')" class="size-20 m-x-15" />
                        <Label
                            :text="_L('firmwareNumber') + ': ' + availableFirmware.simpleNumber"
                            class="size-15 m-x-15 m-b-20"
                            textWrap="true"
                            v-if="availableFirmware && availableFirmware.simpleNumber"
                        />
                        <Label
                            :text="_L('firmwareNumber') + ': --'"
                            class="size-15 m-x-15 m-b-20"
                            textWrap="true"
                            v-if="!availableFirmware || !availableFirmware.simpleNumber"
                        />

                        <Button
                            v-if="updateAvailable"
                            :text="_L('upgradeFirmware')"
                            :isEnabled="station.connected && canUpgrade"
                            @tap="upgradeFirmware"
                            class="btn btn-primary btn-padded"
                        />

                        <Label
                            v-if="missingFirmware"
                            text="No firmware downloaded, please add a portal account."
                            class="size-20 m-x-15"
                            textWrap="true"
                        />

                        <Label v-if="!missingFirmware && !updateAvailable" :text="_L('upToDate')" class="size-20 m-x-15" />

                        <ConnectionNote v-if="updateAvailable" :station="station" :stationId="stationId" />
                    </StackLayout>

                    <WrapLayout orientation="horizontal" class="m-10 m-b-20">
                        <Label :text="_L('additionalInfo')" class="size-16 full-width" textWrap="true" />
                        <Label :text="_L('deviceId') + ': ' + station.deviceId" class="size-14 full-width" textWrap="true" />
                    </WrapLayout>
                </FlexboxLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "@/routes";
import { promiseAfter } from "@/utilities";
import { FirmwareInfo, AvailableFirmware, AvailableStation } from "@/store";
import SharedComponents from "@/components/shared";
import UpgradeFirmwareModal from "./UpgradeFirmwareModal.vue";
import ConnectionNote from "./StationSettingsConnectionNote.vue";

export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionNote,
    },
    data(): {
        canUpgrade: boolean;
        failed: boolean;
        success: boolean;
        sdCard: boolean;
    } {
        return {
            canUpgrade: true,
            failed: false,
            success: false,
            sdCard: false,
        };
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
        stationFirmware(): FirmwareInfo {
            return this.$s.state.firmware.stations[this.stationId];
        },
        availableFirmware(): AvailableFirmware | null {
            return this.$s.state.firmware.available;
        },
        missingFirmware(): boolean {
            return !this.availableFirmware || !this.availableFirmware.simpleNumber;
        },
        updateAvailable(): boolean {
            const local = this.$s.state.firmware.available;
            const station = this.$s.state.firmware.stations[this.stationId];
            console.log("comparing", "station", this.stationId, station, "locally", local);
            if (local && station) {
                const localVersion = local?.simpleNumber || 0;
                const stationVersion = station?.simpleNumber || 0;
                console.log("comparing", "station", stationVersion, "locally", localVersion);
                return Number(localVersion) > Number(stationVersion);
            }
            return false;
        },
    },
    methods: {
        downloadFirmware(): Promise<void> {
            const options = {
                props: {
                    station: this.station,
                    stationId: this.stationId,
                    downloadOnly: true,
                },
                fullscreen: true,
            };
            this.canUpgrade = false;
            return this.$showModal(UpgradeFirmwareModal, options).then((value: unknown) => {
                console.log(`upgrade-done: ${value}`);
                // We do this to prevent them from tapping again right after.
                return promiseAfter(10000).then(() => {
                    this.canUpgrade = true;
                });
            });
        },
        upgradeFirmware(): Promise<void> {
            const options = {
                props: {
                    stationId: this.stationId,
                    downloadOnly: false,
                },
                fullscreen: true,
            };
            this.canUpgrade = false;
            return this.$showModal(UpgradeFirmwareModal, options).then((value: unknown) => {
                console.log(`upgrade-done: ${value}`);
                // We do this to prevent them from tapping again right after.
                return promiseAfter(10000).then(() => {
                    this.canUpgrade = true;
                });
            });
        },
        async goBack(): Promise<void> {
            await Promise.all([
                this.$navigateTo(routes.stationSettings, {
                    props: {
                        stationId: this.station.id,
                    },
                    transition: {
                        name: "slideRight",
                        duration: 250,
                        curve: "linear",
                    },
                }),
            ]);
        },
    },
});
</script>

<style scoped lang="scss">
// Start custom common variables
@import "~/_app-variables";
// End custom common variables

// Custom styles
.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.section-border {
    margin: 10;
    border-bottom-color: $fk-gray-lightest;
    border-bottom-width: 2;
}

.lighter {
    color: $fk-gray-text;
}

.full-width {
    width: 100%;
    margin-bottom: 10;
}
</style>
