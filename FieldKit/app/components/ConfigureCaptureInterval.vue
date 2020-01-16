<template>
    <!-- Data capture interval -->
    <StackLayout class="m-x-10 m-y-20" @loaded="onLoaded">
        <Label class="size-18" :text="_L('dataCaptureSchedule')"></Label>
        <Label
            class="size-12 m-y-5"
            textWrap="true"
            :text="_L('dataCaptureNotice')"
        ></Label>

        <GridLayout rows="*" columns="*" class="m-t-10">
            <!-- nested grid layouts to achieve borders -->
            <GridLayout row="0" col="0" class="inner-border" />
            <GridLayout
                row="0"
                col="0"
                rows="auto,auto"
                columns="*"
                class="m-y-10 interval-container"
            >
                <!-- grid for schedule type buttons -->
                <GridLayout
                    row="0"
                    rows="*"
                    columns="*"
                    id="schedule-btn-container"
                >
                    <Label
                        col="0"
                        :text="_L('scheduled')"
                        horizontalAlignment="right"
                        :class="
                            'schedule-type-btn ' + (basic ? '' : 'selected')
                        "
                        dataType="scheduled"
                        @tap="switchType"
                    ></Label>
                    <Label
                        col="0"
                        :text="_L('basic')"
                        horizontalAlignment="left"
                        :class="
                            'schedule-type-btn ' + (basic ? 'selected' : '')
                        "
                        dataType="basic"
                        @tap="switchType"
                    ></Label>
                </GridLayout>
                <!-- end grid for schedule type buttons -->

                <!-- interval definitions, as many as needed -->
                <StackLayout row="1">
                    <FlexboxLayout
                        flexDirection="column"
                        class="m-t-20"
                        v-for="(interval, index) in intervals"
                        :key="interval.id"
                    >
                        <!-- start and end only show if not basic -->
                        <StackLayout order="1" v-if="!basic" class="m-b-20">
                            <GridLayout rows="auto,auto,auto,auto" columns="50*,50*">
                                <Label
                                    row="0"
                                    colSpan="2"
                                    class="size-18 m-t-15 m-b-10"
                                    :text="_L('captureTime') + ' ' + (index + 1)"
                                ></Label>
                                <!-- start time -->
                                <Label
                                    row="1"
                                    col="0"
                                    :text="_L('start')"
                                    class="size-12 m-b-5"
                                />
                                <Label
                                    row="2"
                                    col="0"
                                    :class="
                                        'time-field '
                                        + (interval.startError
                                        ? 'red no-border'
                                        : '')
                                    "
                                    verticalAligment="bottom"
                                    :text="interval.start.display"
                                    :dataTime="'start-' + interval.id"
                                    @tap="openTimePicker"
                                ></Label>
                                <Label
                                    row="3"
                                    col="0"
                                    class="validation-error"
                                    :text="_L('startBeforeEnd')"
                                    textWrap="true"
                                    :visibility="
                                        interval.startError
                                            ? 'visible'
                                            : 'collapsed'
                                    "
                                ></Label>

                                <!-- end time -->
                                <Label
                                    row="1"
                                    col="1"
                                    :text="_L('end')"
                                    class="size-12 m-b-5"
                                />
                                <Label
                                    row="2"
                                    col="1"
                                    :class="
                                        'time-field '
                                        + (interval.endError
                                        ? 'red no-border'
                                        : '')
                                    "
                                    verticalAligment="bottom"
                                    :text="interval.end.display"
                                    :dataTime="'end-' + interval.id"
                                    @tap="openTimePicker"
                                ></Label>
                                <Label
                                    row="3"
                                    col="1"
                                    class="validation-error"
                                    :text="_L('endAfterStart')"
                                    textWrap="true"
                                    :visibility="
                                        interval.endError
                                            ? 'visible'
                                            : 'collapsed'
                                    "
                                ></Label>
                            </GridLayout>
                        </StackLayout>
                        <StackLayout v-if="basic">
                            <!-- placeholder StackLayout required
                                 by DropDown below in iOS -->
                        </StackLayout>
                        <!-- end scheduled section -->

                        <GridLayout
                            order="2"
                            rows="auto,auto,auto"
                            columns="*,*"
                            v-if="!basic || index == 0"
                        >
                            <Label
                                row="0"
                                col="0"
                                class="size-12 m-t-5"
                                :text="_L('every')"
                            ></Label>
                            <TextField
                                row="1"
                                col="0"
                                :class="
                                    'interval-field ' +
                                        (!interval.noInterval &&
                                        !interval.intervalNotNumber
                                            ? 'interval-input'
                                            : 'no-border')
                                "
                                verticalAligment="bottom"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="interval.display"
                                @blur="saveInterval"
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
                                    :visibility="
                                        interval.noInterval
                                            ? 'visible'
                                            : 'collapsed'
                                    "
                                ></Label>
                                <Label
                                    class="validation-error"
                                    horizontalAlignment="left"
                                    :text="_L('intervalNotNumber')"
                                    textWrap="true"
                                    :visibility="
                                        interval.intervalNotNumber
                                            ? 'visible'
                                            : 'collapsed'
                                    "
                                ></Label>
                            </StackLayout>
                        </GridLayout>
                    </FlexboxLayout>
                    <!-- end interval definitions -->

                    <!-- allow addition of more intervals if not basic -->
                    <FlexboxLayout
                        justifyContent="center"
                        class="m-t-30"
                        @tap="addTime"
                        v-if="!basic"
                    >
                        <Image src="~/images/Icon_Add_Button.png" width="20" />
                        <Label :text="_L('addTime')" class="p-l-5"></Label>
                    </FlexboxLayout>
                </StackLayout>
            </GridLayout>
        </GridLayout>
    </StackLayout>
    <!-- end: Data capture interval -->
</template>

<script>
import * as TimePicker from "tns-core-modules/ui/time-picker";
import Services from "../services/services";
import modalTimePicker from "./ModalTimePicker";

const queryStation = Services.QueryStation();
const dbInterface = Services.Database();

export default {
    data() {
        return {
            basic: true,
            intervals: [],
            selectedTime: new Date(),
            currentlyPicking: {},
            timeUnits: [
                _L("seconds"),
                _L("minutes"),
                _L("hours"),
                _L("days"),
                _L("weeks")
            ]
        };
    },
    props: ["station"],
    methods: {
        onLoaded(args) {
            this.page = args.object;

            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;

            this.intervals = [];
            let converted = this.convertFromSeconds(this.station.interval);
            let interval = {
                id: Date.now(),
                origValue: this.station.interval,
                origUnit: converted.unit,
                value: this.station.interval,
                display: converted.display,
                unit: converted.unit,
                noInterval: false,
                intervalNotNumber: false,
                start: {hour: 6, minute: 1, display: "06:00 AM"},
                end: {hour: 8, minute: 1, display: "08:00 AM"},
                startError: false,
                endError: false
            };
            this.intervals.push(interval);
        },

        addTime() {
            let converted = this.convertFromSeconds(this.station.interval);
            let interval = {
                id: Date.now(),
                origValue: this.station.interval,
                origUnit: converted.unit,
                value: this.station.interval,
                display: converted.display,
                unit: converted.unit,
                noInterval: false,
                intervalNotNumber: false,
                start: {hour: 6, minute: 1, display: "06:00 AM"},
                end: {hour: 8, minute: 1, display: "08:00 AM"},
                startError: false,
                endError: false
            };
            this.intervals.push(interval);
        },

        convertFromSeconds(interval) {
            let displayValue = interval;
            let unit = 0;
            // unit is an index into timeUnits:
            // timeUnits: ["seconds", "minutes", "hours", "days", "weeks"]
            if (interval < 60) {
                // already set to seconds
            } else if (interval < 3600) {
                // minutes
                unit = 1;
                displayValue /= 60;
                displayValue = Math.round(displayValue);
            } else if (interval < 86400) {
                // hours
                unit = 2;
                displayValue /= 3600;
                displayValue = Math.round(displayValue);
            } else if (interval < 604800) {
                // days
                unit = 3;
                displayValue /= 86400;
                displayValue = Math.round(displayValue);
            } else {
                // weeks
                unit = 4;
                displayValue /= 604800;
                displayValue = Math.round(displayValue);
            }
            return { display: displayValue, unit: unit };
        },

        convertToSeconds(interval) {
            switch (interval.unit) {
                case 0:
                    interval.value = interval.display;
                    break;
                case 1:
                    interval.value = interval.display * 60;
                    break;
                case 2:
                    interval.value = interval.display * 3600;
                    break;
                case 3:
                    interval.value = interval.display * 86400;
                    break;
                case 4:
                    interval.value = interval.display * 604800;
                    break;
                default:
                    break;
            }
        },

        checkInterval(interval) {
            // reset these first
            interval.noInterval = false;
            interval.intervalNotNumber = false;
            // then check
            interval.noInterval =
                !interval.display ||
                interval.display == 0 ||
                interval.display.length == 0;
            if (interval.noInterval) {
                return false;
            }
            interval.intervalNotNumber = isNaN(interval.display);
            return !interval.intervalNotNumber;
        },

        saveInterval() {
            this.intervals.forEach(interval => {
                let valid = this.checkInterval(interval);
                if (valid) {
                    let convertedBack = this.convertToSeconds(interval);
                    if (interval.origValue != interval.value) {
                        // send to station

                        // *** TEMP ***
                        // because firmware doesn't support multiple intervals yet
                        // just send each one, the last one will be it for now
                        this.station.interval = interval.value;
                        queryStation.setInterval(this.station).then(result => {
                            // console.log("sent interval and received", result);
                        });

                        // save to database

                        // *** TEMP ***
                        // database also doesn't support multiple intervals yet
                        // just keep in sync with station for now
                        dbInterface.setStationInterval(this.station);
                        interval.origValue = interval.value;
                        interval.origUnit = interval.unit;
                    }
                }
            });
        },

        openTimePicker(event) {
            const data = event.object.dataTime.split("-");
            const current = data[0];
            const id = data[1];
            const interval = this.intervals.find(i => {
                return i.id == id;
            });
            interval.startError = false;
            interval.endError = false;
            if (current == "start") {
                // handle ridiculous no-zero bug in TimePicker
                // but note: midnight will still get set to current hour
                let minute = interval.start.minute == 0 ? 1 : interval.start.minute;
                this.selectedTime.setHours(interval.start.hour, minute, 0);
                this.currentlyPicking = {time: "start", id: id, label: _L("saveStartTime")};
            } else if (current == "end") {
                let minute = interval.end.minute == 0 ? 1 : interval.end.minute;
                this.selectedTime.setHours(interval.end.hour, minute, 0);
                this.currentlyPicking = {time: "end", id: id, label: _L("saveEndTime")};
            }

            const options = {
                props: {
                    selectedTime: this.selectedTime
                },
                fullscreen: true
            };
            this.$showModal(modalTimePicker, options).then(this.submitTime);
        },

        submitTime(modalTime) {
            if (!modalTime) {
                return
            }
            this.selectedTime = modalTime;
            const time = new Date(this.selectedTime);
            const origHour = time.getHours();
            const suffix = origHour < 12 ? " AM" : " PM";
            let hour = origHour % 12 == 0 ? 12 : origHour % 12;
            hour = hour < 10 ? "0" + hour : hour;
            let origMinutes = time.getMinutes();
            const minutes = origMinutes < 10 ? "0" + origMinutes : origMinutes;

            let interval = this.intervals.find(i => {
                return i.id == this.currentlyPicking.id;
            });

            // will be checking to make sure end is after start
            let attemptingStart = new Date();
            let attemptingEnd = new Date();
            if (this.currentlyPicking.time == "start") {
                attemptingStart.setHours(origHour, origMinutes, 0);
                attemptingEnd.setHours(interval.end.hour, interval.end.minute, 0);
                if (attemptingStart < attemptingEnd){
                    // *** TEMP: not sure yet what hardware will want
                    interval.start.hour = origHour;
                    interval.start.minute = origMinutes;
                    interval.start.display = hour + ":" + minutes + suffix;
                } else {
                    interval.startError = true;
                }
            } else if (this.currentlyPicking.time == "end") {
                attemptingStart.setHours(interval.start.hour, interval.start.minute, 0);
                attemptingEnd.setHours(origHour, origMinutes, 0);
                if (attemptingStart < attemptingEnd){
                    interval.end.hour = origHour;
                    interval.end.minute = origMinutes;
                    interval.end.display = hour + ":" + minutes + suffix;
                } else {
                    interval.endError = true;
                }
            }
        },

        openDropDown(event) {
            let id = event.object.dataIntervalId;
            const dropDown = this.page.getViewById("drop-down-"+id);
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
            let id = event.object.id.split("drop-down-")[1];
            let interval = this.intervals.find(i => {
                return i.id == id;
            });
            interval.unit = event.newIndex;
            this.saveInterval();
        },

        switchType(event) {
            this.basic = event.object.dataType == "basic";

            let container = this.page.getViewById("schedule-btn-container");
            container.removeChild(event.object);
            container.addChild(event.object);
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles
.interval-container {
    padding-bottom: 30;
    padding-left: 20;
    padding-right: 20;
}
.inner-border {
    margin-top: 30;
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
}
.schedule-type-btn {
    width: 55%;
    text-align: center;
    background-color: white;
    color: $fk-gray-light;
    border-radius: 20;
    border-width: 1;
    border-color: $fk-gray-lighter;
    padding-top: 10;
    padding-bottom: 10;
}
#schedule-btn-container .selected {
    background-color: $fk-primary-black;
    color: white;
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
