<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="80,*,70">
            <StackLayout row="0" class="p-t-10">
                <ScreenHeader :title="_L('uploadSchedule')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                <StackLayout class="p-b-10"></StackLayout>
            </StackLayout>
            <ScrollView row="1">
                <StackLayout class="m-y-20">
                    <GridLayout rows="auto,auto,auto" columns="*,*" class="m-x-20">
                        <Label row="0" col="0" class="size-12 m-y-10" :text="_L('every')"></Label>
                        <TextField
                            row="1"
                            col="0"
                            :class="
                                'interval-field ' +
                                (!interval.noInterval && !interval.intervalTooSmall && !interval.intervalNotNumber
                                    ? 'interval-input'
                                    : 'no-border')
                            "
                            verticalAligment="bottom"
                            keyboardType="name"
                            autocorrect="false"
                            autocapitalizationType="none"
                            v-model="interval.display"
                        ></TextField>
                        <StackLayout row="1" col="1">
                            <GridLayout rows="*" columns="*">
                                <DropDown
                                    row="0"
                                    col="0"
                                    class="p-l-5 p-b-2 size-18 drop-down"
                                    :items="timeUnits"
                                    :id="'drop-down-' + interval.id"
                                    :selectedIndex="interval.unit"
                                    @opened="onOpened"
                                    @selectedIndexChanged="onDropDownSelection"
                                ></DropDown>
                                <Image
                                    row="0"
                                    col="0"
                                    width="15"
                                    class="m-r-5"
                                    horizontalAlignment="right"
                                    verticalAlignment="middle"
                                    src="~/images/Icon_Cheveron_Down.png"
                                    :dataIntervalId="interval.id"
                                    @tap="openDropDown"
                                />
                            </GridLayout>
                        </StackLayout>
                        <StackLayout row="2" col="0">
                            <Label
                                class="validation-error"
                                horizontalAlignment="left"
                                :text="_L('intervalRequired')"
                                textWrap="true"
                                :visibility="interval.noInterval ? 'visible' : 'collapsed'"
                            ></Label>
                            <Label
                                class="validation-error"
                                horizontalAlignment="left"
                                :text="_L('intervalTooSmall')"
                                textWrap="true"
                                :visibility="interval.intervalTooSmall ? 'visible' : 'collapsed'"
                            ></Label>
                            <Label
                                class="validation-error"
                                horizontalAlignment="left"
                                :text="_L('intervalNotNumber')"
                                textWrap="true"
                                :visibility="interval.intervalNotNumber ? 'visible' : 'collapsed'"
                            ></Label>
                        </StackLayout>
                    </GridLayout>
                    <StackLayout class="p-b-20"></StackLayout>
                    <Button
                        class="btn btn-primary btn-padded"
                        :text="_L('save')"
                        :isEnabled="station.connected"
                        @tap="saveUploadInterval"
                    />
                    <ConnectionNote :station="station" />
                </StackLayout>
            </ScrollView>

            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import * as dialogs from "tns-core-modules/ui/dialogs";
import routes from "../../routes";
import Services from "../../services/services";

import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";
import WiFi from "./StationSettingsWiFi";
import ConnectionNote from "./StationSettingsConnectionNote";

const dbInterface = Services.Database();
const queryStation = Services.QueryStation();
const oneHour = 3600;

export default {
    data() {
        return {
            interval: {},
            timeUnits: [_L("minutes"), _L("hours"), _L("days"), _L("weeks"), _L("months"), _L("years")],
        };
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
        station: {
            required: true,
            type: Object,
        },
    },
    components: {
        ScreenHeader,
        ScreenFooter,
        WiFi,
        ConnectionNote,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            let deviceStatus = this.station.statusJson;
            let converted, origValue;
            try {
                origValue = deviceStatus.schedules.network.duration;
                converted = this.convertFromSeconds(deviceStatus.schedules.network.duration);
            } catch (e) {
                converted = this.convertFromSeconds(oneHour);
                origValue = oneHour;
            }
            this.deviceStatus = deviceStatus;
            this.interval = {
                id: Date.now(),
                noInterval: false,
                intervalTooSmall: false,
                intervalNotNumber: false,
                origValue: origValue,
                origUnit: converted.unit,
                value: origValue,
                display: converted.display,
                unit: converted.unit,
            };
            this.checkInterval(this.interval);
        },

        goBack(event) {
            if (event) {
                // Change background color when pressed
                let cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            this.$navigateTo(WiFi, {
                props: {
                    stationId: this.stationId,
                    station: this.station,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
        },

        convertFromSeconds(interval) {
            let displayValue = interval;
            let unit;
            // unit is an index into this.timeUnits:
            if (interval < 3600) {
                // minutes
                unit = 0;
                displayValue /= 60;
                displayValue = Math.round(displayValue);
            } else if (interval < 86400) {
                // hours
                unit = 1;
                displayValue /= 3600;
                displayValue = Math.round(displayValue);
            } else if (interval < 604800) {
                // days
                unit = 2;
                displayValue /= 86400;
                displayValue = Math.round(displayValue);
            } else if (interval < 2628000) {
                // weeks
                unit = 3;
                displayValue /= 604800;
                displayValue = Math.round(displayValue);
            } else if (interval < 31535965) {
                // months
                unit = 4;
                displayValue /= 2628000;
                displayValue = Math.round(displayValue);
            } else {
                // years
                unit = 5;
                displayValue /= 31535965;
                displayValue = Math.round(displayValue);
                // if they have ever configured the station to upload over wifi,
                // this displayValue will likely be 136 years. That's not accurate,
                // so we don't need to show it. Show one year instead.
                if (displayValue > 100) {
                    displayValue = 1;
                }
            }
            return { display: displayValue, unit: unit };
        },

        convertToSeconds(interval) {
            switch (interval.unit) {
                case 0:
                    interval.value = interval.display * 60;
                    break;
                case 1:
                    interval.value = interval.display * 3600;
                    break;
                case 2:
                    interval.value = interval.display * 86400;
                    break;
                case 3:
                    interval.value = interval.display * 604800;
                    break;
                case 4:
                    interval.value = interval.display * 2628000;
                    break;
                case 5:
                    interval.value = interval.display * 31535965;
                    break;
                default:
                    break;
            }
        },

        checkInterval(interval) {
            // reset these first
            interval.noInterval = false;
            interval.intervalTooSmall = false;
            interval.intervalNotNumber = false;
            // then check
            interval.noInterval = !interval.display || interval.display == 0 || interval.display.length == 0;
            if (interval.noInterval) {
                return false;
            }
            if (interval.display < 1) {
                interval.intervalTooSmall = true;
                return false;
            }
            interval.intervalNotNumber = isNaN(interval.display);
            return !interval.intervalNotNumber;
        },

        saveUploadInterval() {
            const valid = this.checkInterval(this.interval);
            if (valid) {
                const convertedBack = this.convertToSeconds(this.interval);
                if (this.interval.origValue != this.interval.value) {
                    // send to station
                    this.station.uploadSchedule = this.interval.value;
                    this.interval.origValue = this.interval.value;
                    this.interval.origUnit = this.interval.unit;
                    queryStation.setStationUploadSchedule(this.station).then((result) => {
                        // in order to match in the interim, must edit station.statusJson
                        this.deviceStatus.schedules = result.schedules;
                        this.station.statusJson = this.deviceStatus;
                        this.goBack();
                    });
                }
            }
        },

        openDropDown(event) {
            const id = event.object.dataIntervalId;
            const dropDown = this.page.getViewById("drop-down-" + id);
            dropDown.open();
        },

        onOpened(event) {
            // provide feedback by changing background color
            event.object.backgroundColor = "#F4F5F7";
            setTimeout(() => {
                event.object.backgroundColor = "white";
            }, 500);
        },

        onDropDownSelection(event) {
            // let id = event.object.id.split("drop-down-")[1];
            // let interval = this.intervals.find(i => {
            //     return i.id == id;
            // });
            this.interval.unit = event.newIndex;
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "~/_app-variables";
// End custom common variables

// Custom styles
.disabled {
    opacity: 0.5;
}
.gray-bkgd {
    border-radius: 4;
    padding: 10;
    background-color: $fk-gray-lightest;
}
.hint {
    color: $fk-gray-light;
}
.time-field {
    font-size: 18;
    margin-right: 20;
    padding-bottom: 2;
    border-bottom-width: 1;
    border-bottom-color: $fk-primary-black;
}
.red {
    color: $fk-tertiary-red;
}
.interval-field {
    padding: 0;
    font-size: 18;
    margin-right: 20;
}
.interval-input {
    border-bottom-width: 1;
    border-bottom-color: $fk-primary-black;
}
.no-border {
    border-bottom-width: 1;
    border-bottom-color: white;
}
.validation-error {
    margin-right: 20;
    font-size: 12;
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
}
.drop-down {
    background-color: white;
    border-width: 0;
    border-bottom-width: 1;
    border-bottom-color: $fk-primary-black;
}
</style>
