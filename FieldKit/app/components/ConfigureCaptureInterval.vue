<template>
    <!-- Data capture interval -->
    <StackLayout class="m-x-10 m-t-20 m-b-10" @loaded="onLoaded">
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
                    class="m-b-20"
                >
                    <Label
                        col="0"
                        text="Scheduled"
                        horizontalAlignment="right"
                        :class="
                            'schedule-type-btn ' + (daily ? '' : 'selected')
                        "
                        dataType="daily"
                        @tap="switchType"
                    ></Label>
                    <Label
                        col="0"
                        text="24-hour"
                        horizontalAlignment="left"
                        :class="
                            'schedule-type-btn ' + (daily ? 'selected' : '')
                        "
                        dataType="scheduled"
                        @tap="switchType"
                    ></Label>
                </GridLayout>
                <!-- end grid for schedule type buttons -->

                <!-- interval definitions, as many as needed -->
                <StackLayout row="1" v-for="interval in intervals" :key="interval.id">
                    <StackLayout v-if="!daily" class="slider-container">
                        <Label text="(hour slider)" />
                    </StackLayout>
                    <GridLayout rows="auto,auto,auto", columns="*,*">
                        <Label
                            row="0"
                            col="0"
                            class="size-12 m-t-5"
                            text="Every"
                        ></Label>
                        <TextField
                            row="1"
                            col="0"
                            :class="
                                'interval-field ' +
                                !interval.noInterval && !interval.intervalNotNumber
                                    ? 'interval-input'
                                    : 'no-border'
                            "
                            verticalAligment="bottom"
                            keyboardType="name"
                            autocorrect="false"
                            autocapitalizationType="none"
                            v-model="interval.display"
                            @blur="saveInterval"
                        ></TextField>
                        <StackLayout row="1" col="1" class="drop-down-container">
                            <DropDown
                                :items="timeUnits"
                                :id="interval.id"
                                @selectedIndexChanged="onSelectedIndexChanged"
                                backgroundColor="#F4F5F7"
                                class="drop-down"
                                :selectedIndex="interval.unit"
                            ></DropDown>
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
                                :text="_L('intervalNotNumber')"
                                textWrap="true"
                                :visibility="
                                    interval.intervalNotNumber ? 'visible' : 'collapsed'
                                "
                            ></Label>
                        </StackLayout>
                    </GridLayout>
                    <FlexboxLayout
                        justifyContent="center"
                        class="m-t-30"
                        v-if="!daily">
                        <Image src="~/images/add.png" width="20" />
                        <Label text="Add Time" class="p-l-5"></Label>
                    </FlexboxLayout>
                </StackLayout>
                <!-- end interval definitions -->
            </GridLayout>
        </GridLayout>
    </StackLayout>
    <!-- end: Data capture interval -->
</template>

<script>
import Services from "../services/services";

const queryStation = Services.QueryStation();
const dbInterface = Services.Database();

export default {
    data() {
        return {
            daily: true,
            intervals: [],
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

            let converted = this.convertFromSeconds(this.station.interval);
            let interval = {
                id: 1,
                origValue: this.station.interval,
                origUnit: converted.unit,
                value: this.station.interval,
                display: converted.display,
                unit: converted.unit,
                noInterval: false,
                intervalNotNumber: false
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
            return {display: displayValue, unit: unit};
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
                        // just keep in sync with station for npw
                        dbInterface.setStationInterval(this.station);
                        interval.origValue = interval.value;
                        interval.origUnit = interval.unit;
                    }
                }
            });
        },

        onSelectedIndexChanged(event) {
            let id = event.object.id;
            let interval = this.intervals.find(i => {
                return i.id == id;
            });
            interval.unit = event.newIndex;
            this.saveInterval();
        },

        switchType(event) {
            this.daily = event.object.dataType != "daily";

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
.slider-container {
    text-align: center;
}
.interval-field {
    padding: 0;
    margin-right: 20;
    font-size: 18;
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
    font-size: 12;
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
}
.drop-down-container {
    border-radius: 4;
    border-width: 1;
    border-color: $fk-gray-lighter;
}
</style>
