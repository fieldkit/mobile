<template>
    <Page>
        <PlatformHeader :title="_L('firmware')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected">
            <GridLayout rows="*" columns="*">
                <StackLayout row="0" col="0" class="p-l-20 p-r-20">
                    <StackLayout class="m-t-1 p-t-20 p-b-20 section-border">
                        <StackLayout orientation="horizontal">
                            <StackLayout width="56" height="56" class="circle-border m-r-15">
                                <Image
                                    class="m-t-15"
                                    width="42"
                                    :src="
                                        station.connected ? '~/images/Icon_Station_Firmware.png' : '~/images/Icon_Station_Not_Connected.png'
                                    "
                                    @doubleTap="showFirmwares"
                                ></Image>
                            </StackLayout>
                            <StackLayout>
                                <Label :text="station.name" textWrap="true" class="size-16 m-b-5" />
                                <!-- TODO i18n interpolate -->
                                <Label
                                    :text="_L('firmwareVersion') + ' ' + stationFirmware.version"
                                    class="size-14 m-b-5"
                                    textWrap="true"
                                    v-if="stationFirmware"
                                />
                                <Label :text="station.connected ? _L('stationConnected') : _L('notConnected')" class="size-14" />
                            </StackLayout>
                        </StackLayout>
                    </StackLayout>
                    <StackLayout class="p-t-20 p-b-20">
                        <template v-if="currentState === State.noUpdate">
                            <Label :text="_L('firmwareUpToDate')" class="size-16 m-b-5" />
                            <Label class="size-12 m-b-30" textWrap="true" v-if="availableFirmware">
                                <FormattedString>
                                    <Span :text="_L('lastUpdate')" />
                                    <Span :text="availableFirmware.buildTimeUnix | prettyDateUnix" />
                                </FormattedString>
                            </Label>
                            <Button
                                :text="_L('updateFirmware')"
                                :isEnabled="updateAvailable && station.connected && canUpgrade"
                                @tap="upgradeFirmware"
                                class="btn btn-primary btn-no-margin btn-color-white"
                            />
                            <Button
                                :isEnabled="!downloading.checking"
                                :text="_L('checkForFirmware')"
                                class="btn btn-update btn-no-margin"
                                @tap="downloadFirmware"
                            />

                            <StackLayout class="quick-tip">
                                <StackLayout orientation="horizontal" class="m-b-25">
                                    <Image class="m-r-10" width="18" src="~/images/Icon_Quick_Tip.png"></Image>
                                    <Label :text="_L('firmwareQuickTipTitle')" class="size-18 m-t-5" />
                                </StackLayout>
                                <Label :text="_L('firmwareCheckQuickTipBody')" class="size-16" lineHeight="4" textWrap="true" />
                            </StackLayout>
                        </template>

                        <template v-if="currentState === State.updateAvailable">
                            <Label :text="_L('updateAvailableTitle')" class="size-16 m-b-5" />
                            <Label :text="_L('updateAvailableBody')" class="size-12 m-b-30" textWrap="true" />
                            <Button
                                :text="_L('updateFirmware')"
                                :isEnabled="updateAvailable && station.connected && canUpgrade"
                                @tap="upgradeFirmware"
                                class="btn btn-primary btn-no-margin btn-color-white"
                            />
                            <Button
                                :isEnabled="!downloading.checking"
                                :text="_L('checkForFirmware')"
                                class="btn btn-update btn-no-margin"
                                @tap="downloadFirmware"
                            />
                        </template>

                        <template v-if="currentState === State.checking">
                            <Label :text="_L('checkForUpdates')" class="size-16 m-b-15" />
                            <StackLayout borderRadius="4" height="10">
                                <Progress :value="progress" scaleY="5" />
                            </StackLayout>
                        </template>
                        <template v-if="currentState === State.updating">
                            <Label :text="_L('updatingFirmware')" class="size-16 m-b-15" />
                            <Label :text="_L('firmwareVersion') + ' ' + selectedFirmware.version" class="size-12 m-b-5" textWrap="true" />
                            <StackLayout borderRadius="4" height="10">
                                <Progress :value="updateProgress" scaleY="5" />
                            </StackLayout>
                        </template>

                        <template v-if="currentState === State.restarting">
                            <Label :text="_L('stationRestarting')" class="size-16 m-b-15" />
                            <Label :text="_L('firmwareVersion') + ' ' + selectedFirmware.version" class="size-12 m-b-5" textWrap="true" />
                            <StackLayout borderRadius="4" height="10">
                                <GridLayout rows="*">
                                    <AbsoluteLayout width="100%" height="10" clipToBounds="true">
                                        <StackLayout width="100%" height="10" class="restart"></StackLayout>
                                        <StackLayout left="0" width="100%" height="10" class="restart restart-animation"></StackLayout>
                                    </AbsoluteLayout>
                                </GridLayout>
                            </StackLayout>
                            <StackLayout class="quick-tip">
                                <StackLayout orientation="horizontal" class="m-b-25">
                                    <Image class="m-r-10" width="18" src="~/images/Icon_Quick_Tip.png"></Image>
                                    <Label :text="_L('firmwareQuickTipTitle')" class="size-18 m-t-5" />
                                </StackLayout>
                                <Label :text="_L('firmwareQuickTipBody')" class="size-16" lineHeight="4" textWrap="true" />
                            </StackLayout>
                        </template>
                    </StackLayout>
                </StackLayout>

                <AbsoluteLayout row="0" col="0" class="text-center" v-if="currentState === State.updateDone" @tap="dismissUpdate">
                    <GridLayout top="75" width="100%">
                        <StackLayout class="updated-dialog-container">
                            <Image width="60" src="~/images/Icon_Success.png"></Image>
                            <Label :text="_L('firmwareUpdateComplete')" class="m-t-20 size-16" />
                        </StackLayout>
                    </GridLayout>
                </AbsoluteLayout>

                <AbsoluteLayout row="0" col="0" class="text-center" v-if="updateStatus.sdCard">
                    <GridLayout top="75" width="100%">
                        <StackLayout class="sdcard-dialog-container">
                            <Image src="~/images/Icon_Warning_error.png" width="60"></Image>
                            <Label :text="_L('firmwareNoCardTitle')" class="size-18 bold m-t-20"></Label>
                            <Label :text="_L('firmwareNoCardBody')" class="size-16 m-t-20 m-b-30" textWrap="true"></Label>
                            <Button class="btn btn-primary btn-padded" :text="_L('firmwareNoCardDismiss')" @tap="dismissNoCard" />
                            <Label :text="_L('firmwareNoCardHelp')" class="size-14 m-t-30" @tap="onProductGuide"></Label>
                        </StackLayout>
                    </GridLayout>
                </AbsoluteLayout>
            </GridLayout>
        </StationSettingsLayout>
    </Page>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import SharedComponents from "@/components/shared";
import ConnectionStatusHeader from "@/components/ConnectionStatusHeader.vue";
import UpgradeFirmwareModal from "./UpgradeFirmwareModal.vue";
import { fullRoutes } from "@/routes";
import {
    ActionTypes,
    FirmwareInfo,
    AvailableFirmware,
    AvailableStation,
    UpgradeStationFirmwareAction,
    UpgradeInfo,
    UpgradeStatus,
    UpgradeStatusMutation,
} from "@/store";
import * as utils from "@nativescript/core/utils/utils";
import ChooseFirmwareModal from "~/components/settings/ChooseFirmwareModal.vue";
import { debug } from "@/lib";

enum State {
    noUpdate = "noUpdate",
    updateAvailable = "updateAvailable",
    checking = "checking",
    updating = "updating",
    restarting = "restarting",
    updateDone = "updateDone",
}
export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
    },
    data(): {
        downloading: {
            checking: boolean;
            failed: boolean;
        };
        canUpgrade: boolean;
        failed: boolean;
        success: boolean;
        progress: number;
        expectedVersion: string;
        selectedFirmware: AvailableFirmware | null;
        currentState: State;
        State;
        unwatch: Function;
    } {
        return {
            downloading: {
                checking: false,
                failed: false,
            },
            canUpgrade: true,
            failed: false,
            success: false,
            progress: 0,
            expectedVersion: "",
            selectedFirmware: null,
            currentState: State.noUpdate,
            State: State,
            unwatch: () => {},
        };
    },
    props: {
        stationId: {
            type: Number,
            required: true,
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
            const firmwares = this.$s.state.firmware.available;

            if (firmwares === null) {
                return null;
            }

            return firmwares.reduce((a, b) => (a.buildTimeUnix > b.buildTimeUnix ? a : b));
        },
        selectableFirmwares(): AvailableFirmware[] | null {
            const firmwares = this.$s.state.firmware.available;

            if (firmwares === null) {
                return null;
            }

            return firmwares.filter((item) => item.module === "fk-core");
        },
        missingFirmware(): boolean {
            return !this.availableFirmware || !this.availableFirmware.simpleNumber;
        },
        updateAvailable(): boolean {
            const available = this.availableFirmware;
            const station = this.$s.state.firmware.stations[this.stationId];
            if (available && station) {
                const availableNumber = available?.simpleNumber || 0;
                const stationNumber = station?.simpleNumber || 0;
                const availableUnix = available?.buildTimeUnix || 0;
                const stationUnix = station?.time || 0;
                const canUpdate = Number(availableUnix) > Number(stationUnix);
                debug.log(`firmware: can=${canUpdate} station: ${station.version} unix=${stationUnix} number=${stationNumber}`);
                debug.log(`firmware: can=${canUpdate} available: ${available.version} unix=${availableUnix} number=${availableNumber}`);

                if (canUpdate) {
                    this.currentState = State.updateAvailable;
                }
                return canUpdate;
            } else {
                debug.log(`missing available or station firmware`);
            }
            return false;
        },
        update(): UpgradeInfo {
            return this.$s.state.firmware.status[this.stationId] || {};
        },
        updateStatus(): UpgradeStatus {
            return this.update?.status || {};
        },
        updateProgress(): number {
            return this.update?.progress?.progress || 0;
        },
    },
    created(): void {
        this.unwatch = this.$s.watch(
            (state, getters) => getters.legacyStations[this.stationId].connected,
            (newValue, oldValue) => {
                if (oldValue === false && newValue === true) {
                    setTimeout(() => {
                        if (this.expectedVersion && this.expectedVersion === this.stationFirmware.version) {
                            this.currentState = State.updateDone;
                            setTimeout(() => {
                                this.currentState = State.noUpdate;
                            }, 3000);
                        }
                    }, 3000);
                }
            }
        );
    },
    beforeDestroy(): void {
        this.unwatch();
    },
    methods: {
        async downloadFirmware(): Promise<void> {
            this.downloading = {
                checking: true,
                failed: false,
            };
            this.currentState = State.checking;

            try {
                this.progress = 0;
                await this.$services.StationFirmware().downloadFirmware((tp) => {
                    this.progress = tp.progress;
                });

                await this.$store.dispatch(ActionTypes.RELOAD_FIRMWARE);

                this.downloading = {
                    checking: false,
                    failed: false,
                };
            } catch (err) {
                this.downloading = {
                    checking: false,
                    failed: true,
                };
            }

            this.currentState = this.updateAvailable ? State.updateAvailable : State.noUpdate;
        },
        async upgradeFirmware(): Promise<void> {
            const options = {
                props: {
                    stationId: this.stationId,
                    downloadOnly: false,
                },
                fullscreen: true,
            };
            this.canUpgrade = false;
            await this.$showModal(UpgradeFirmwareModal, options).then((value: { updating: boolean }) => {
                debug.log(`upgrade-done: ${JSON.stringify(value)}`);
                if (value.updating) {
                    if (!this.station) throw new Error(`firmware-modal: no such station`);
                    if (!this.station.id) throw new Error(`firmware-modal: no station id`);
                    if (!this.station.url) throw new Error(`firmware-modal: no station url`);
                    this.selectedFirmware = this.availableFirmware;
                    debug.log(`selected-firmware`, this.selectedFirmware);
                    this.currentState = State.updating;
                    this.$s.dispatch(new UpgradeStationFirmwareAction(this.station.id, this.station.url)).then(() => {
                        this.currentState = State.restarting;
                        this.expectedVersion = this.availableFirmware?.version ? this.availableFirmware.version : "";
                    });
                } else {
                    this.canUpgrade = true;
                }
                return Promise.resolve();
            });
        },
        async addAccount(): Promise<void> {
            debug.log("addAccount");
            await this.$deprecatedNavigateTo(fullRoutes.settings.addAccount);
        },
        dismissUpdate(): void {
            this.currentState = State.noUpdate;
        },
        dismissNoCard(): void {
            this.$s.commit(new UpgradeStatusMutation(this.stationId, { error: true }));
            this.currentState = this.updateAvailable ? State.updateAvailable : State.noUpdate;
        },
        async showFirmwares(): Promise<void> {
            const options = {
                props: {
                    firmwares: this.selectableFirmwares,
                    selectedFirmware: this.selectedFirmware,
                },
                fullscreen: true,
            };
            await this.$showModal(ChooseFirmwareModal, options).then((value: { firmware: AvailableFirmware | null; updating: boolean }) => {
                if (value.updating && value.firmware) {
                    if (!this.station) throw new Error(`firmware-modal: no such station`);
                    if (!this.station.id) throw new Error(`firmware-modal: no station id`);
                    if (!this.station.url) throw new Error(`firmware-modal: no station url`);
                    this.selectedFirmware = value.firmware;
                    debug.log(`selected-firmware`, this.selectedFirmware);
                    this.currentState = State.updating;
                    this.$s
                        .dispatch(new UpgradeStationFirmwareAction(this.station.id, this.station.url, this.selectedFirmware.id))
                        .then(() => {
                            this.currentState = State.restarting;
                            this.expectedVersion = value.firmware?.version ? value.firmware.version : "";
                        });
                }

                return Promise.resolve();
            });
        },
        onProductGuide(): void {
            utils.openUrl("https://www.fieldkit.org/product-guide/set-up-station/#ready-to-deploy");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.section-border {
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.lighter {
    color: $fk-gray-text;
}

.full-width {
    width: 100%;
    margin-bottom: 10;
}

.circle-border {
    border-color: $fk-gray-lighter;
    border-radius: 100%;
    border-width: 1;
}

.btn-color-white {
    color: white;
}

.btn-no-margin {
    margin-right: 0;
    margin-left: 0;
}

.btn-update {
    font-size: 18;
    text-transform: none;
    font-weight: bold;
    border-color: $fk-primary-red;
    border-width: 1;
    background-color: white;
}

.quick-tip {
    margin-top: 100;
    padding: 15 20;
    background-color: $fk-gray-lightest;
}

.updated-dialog-container {
    border-radius: 4;
    background-color: $fk-gray-lightest;
    color: $fk-primary-black;
    border-color: $fk-gray-lighter;
    border-width: 1;
    width: 180;
    height: 180;
    padding-top: 40;
}

.sdcard-dialog-container {
    border-radius: 4;
    background-color: white;
    color: $fk-primary-black;
    border-color: $fk-gray-lighter;
    border-width: 1;
    width: 300;
    padding: 30 20;
}

Progress {
    color: $fk-logo-blue;
}

@keyframes progress-restarting {
    from {
        transform: translate(-10, 0);
    }
    to {
        transform: translate(0, 0);
    }
}

.restart-animation {
    animation-name: progress-restarting;
    animation-duration: 2s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
}

.restart {
    background-repeat: repeat-x;
    background-image: url("~/images/Icon_Restarting_Firmware_Short.png");
    background-position: center;
    background-size: contain;
    border-radius: 4;
}
</style>
