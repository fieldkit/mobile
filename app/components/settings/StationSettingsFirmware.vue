<template>
    <Page>
        <PlatformHeader :title="_L('firmware')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
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

                        <template v-if="!missingFirmware">
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
                        </template>

                        <Label v-if="!missingFirmware && !updateAvailable" :text="_L('upToDate')" class="size-20 m-x-15" />
                        <Button
                            v-if="updateAvailable"
                            :text="_L('upgradeFirmware')"
                            :isEnabled="station.connected && canUpgrade"
                            @tap="upgradeFirmware"
                            class="btn btn-primary btn-padded"
                        />

                        // Check for new firmware.
                        <template v-if="haveAccounts">
                            <Label v-if="missingFirmware" text="No firmware downloaded" class="m-x-15" textWrap="true" />
                            <Button :isEnabled="!checking" text="Check for new firmware" @tap="downloadFirmware" class="m-x-15" />
                            <Label v-if="checking" text="Checking" class="m-x-15" />
                            <Progress v-if="checking" :value="progress" scaleY="4" class="m-x-15" />
                        </template>
                        <template v-else>
                            <Label text="To check for new firmware you need to add an account." class="m-x-15" textWrap="true" />
                            <Button text="Add Account" @tap="addAccount" class="m-x-15" />
                        </template>
                    </StackLayout>

                    <WrapLayout orientation="horizontal" class="m-x-20">
                        <Label :text="_L('additionalInfo')" class="size-16 full-width" textWrap="true" />
                        <Label :text="_L('deviceId') + ': ' + station.deviceId" class="size-14 full-width" textWrap="true" />
                    </WrapLayout>
                </FlexboxLayout>
            </ScrollView>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { promiseAfter } from "@/utilities";
import { FirmwareInfo, AvailableFirmware, AvailableStation } from "@/store";
import SharedComponents from "@/components/shared";
import UpgradeFirmwareModal from "./UpgradeFirmwareModal.vue";
import ConnectionNote from "./StationSettingsConnectionNote.vue";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";
import { getBus } from "@/components/NavigationBus";

export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionNote,
        ConnectionStatusHeader,
    },
    data(): {
        checking: boolean;
        canUpgrade: boolean;
        failed: boolean;
        success: boolean;
        sdCard: boolean;
        progress: number;
    } {
        return {
            checking: false,
            canUpgrade: true,
            failed: false,
            success: false,
            sdCard: false,
            progress: 0,
        };
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        haveAccounts(): boolean {
            return this.$s.state.portal.accounts.length > 0;
        },
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
        async downloadFirmware(): Promise<void> {
            this.checking = true;
            this.progress = 0;
            await this.$services.StationFirmware().downloadFirmware((tp) => {
                this.progress = tp.progress;
            });
            this.checking = false;
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
                    // this.canUpgrade = true;
                });
            });
        },
        async addAccount(): Promise<void> {
            console.log("addAccount");
            getBus().$emit("open-settings", "account");
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
