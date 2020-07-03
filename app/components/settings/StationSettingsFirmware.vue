<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <FlexboxLayout flexDirection="column" justifyContent="space-between" class="p-t-10">
                    <ScreenHeader :title="_L('firmware')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />

                    <StackLayout class="m-t-10 m-b-30">
                        <Label :text="_L('stationFirmwareVersion')" class="size-20 m-x-15" />
                        <Label :text="_L('firmwareNumber') + ': ' + stationFirmware.simpleNumber" class="size-15 m-x-15 m-b-20" textWrap="true" v-if="stationFirmware" />
                        <Label :text="_L('firmwareNumber') + ': --'" class="size-15 m-x-15 m-b-20" textWrap="true" v-if="!stationFirmware" />
                        <Label :text="_L('appFirmwareVersion')" class="size-20 m-x-15" />
                        <Label :text="_L('firmwareNumber') + ': ' + availableFirmware.simpleNumber" class="size-15 m-x-15 m-b-20" textWrap="true" v-if="availableFirmware" />
                        <Label :text="_L('firmwareNumber') + ': --'" class="size-15 m-x-15 m-b-20" textWrap="true" v-if="!availableFirmware" />

                        <Button
                            v-if="updateAvailable"
                            :text="_L('upgradeFirmware')"
                            :isEnabled="station.connected"
                            @tap="upgradeFirmware"
                            class="btn btn-primary btn-padded"
                        ></Button>
                        <Label v-else :text="_L('upToDate')" class="size-20 m-x-15" />
                        <ConnectionNote v-if="updateAvailable" :station="station" />
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

<script>
import routes from "../../routes";
import { hexStringToByteWiseString } from "../../utilities";
import Services from "../../services/services";

import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";
import UpgradeFirmwareModal from "./UpgradeFirmwareModal";
import ConnectionNote from "./StationSettingsConnectionNote";

export default {
    components: {
        ScreenHeader,
        ScreenFooter,
        ConnectionNote,
    },
    data() {
        return {};
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    computed: {
        station() {
            return this.$store.getters.legacyStations[this.stationId];
        },
        stationFirmware() {
            return this.$store.state.firmware.stations[this.stationId];
        },
        availableFirmware() {
            return this.$store.state.firmware.available;
        },
        updateAvailable() {
            if (this.$store.state.firmware.stations[this.stationId] && this.$store.state.firmware.available) {
                return this.$store.state.firmware.available > this.$store.state.firmware.stations[this.stationId];
            }
            return true;
        },
    },
    methods: {
        onPageLoaded(args) {},
        downloadFirmware(args) {
            const options = {
                props: {
                    station: this.station,
                    downloadOnly: true,
                },
                fullscreen: true,
            };
            return this.$showModal(UpgradeFirmwareModal, options);
        },
        upgradeFirmware(args) {
            const options = {
                props: {
                    station: this.station,
                    downloadOnly: false,
                },
                fullscreen: true,
            };
            return this.$showModal(UpgradeFirmwareModal, options);
        },
        goBack(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            return this.$navigateTo(routes.stationSettings, {
                props: {
                    station: this.station,
                    stationId: this.station.id,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
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
