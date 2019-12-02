<template>
    <!-- Data capture interval -->
    <StackLayout class="m-x-10 m-t-20 m-b-10">
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
                rows="auto,auto,auto,auto"
                columns="*,*"
                class="m-y-10 interval-container"
                @loaded="onLoaded"
            >
                <GridLayout
                    row="0"
                    colSpan="2"
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
                <Label
                    row="1"
                    col="0"
                    class="size-12 m-t-5"
                    text="Every"
                ></Label>
                <TextField
                    row="2"
                    col="0"
                    :class="
                        !noInterval && !intervalNotNumber
                            ? 'interval-input'
                            : 'no-border'
                    "
                    id="interval-field"
                    :isEnabled="true"
                    verticalAligment="bottom"
                    keyboardType="name"
                    autocorrect="false"
                    autocapitalizationType="none"
                    v-model="displayInterval"
                    @blur="saveInterval"
                ></TextField>
                <StackLayout row="2" col="1" id="drop-down-container">
                    <DropDown
                        :items="timeUnits"
                        @selectedIndexChanged="onSelectedIndexChanged"
                        backgroundColor="#F4F5F7"
                        class="drop-down"
                        :selectedIndex="currentUnit"
                    ></DropDown>
                </StackLayout>
                <StackLayout row="3" col="0">
                    <Label
                        class="validation-error"
                        id="no-interval"
                        horizontalAlignment="left"
                        :text="_L('intervalRequired')"
                        textWrap="true"
                        :visibility="noInterval ? 'visible' : 'collapsed'"
                    ></Label>
                    <Label
                        class="validation-error"
                        id="interval-not-numeric"
                        horizontalAlignment="left"
                        :text="_L('intervalNotNumber')"
                        textWrap="true"
                        :visibility="
                            intervalNotNumber ? 'visible' : 'collapsed'
                        "
                    ></Label>
                </StackLayout>
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
            currentUnit: 0,
            origUnit: 0,
            displayInterval: "",
            noInterval: false,
            intervalNotNumber: false,
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

            this.origInterval = this.station.interval;
            this.convertFromSeconds();
            // save original time unit created in convertFromSeconds()
            this.origUnit = this.currentUnit;
        },

        convertFromSeconds() {
            let displayValue = this.station.interval;
            // this.currentUnit is an index into timeUnits:
            // timeUnits: ["seconds", "minutes", "hours", "days", "weeks"]
            if (this.station.interval < 60) {
                // seconds
                this.currentUnit = 0;
            } else if (this.station.interval < 3600) {
                // minutes
                this.currentUnit = 1;
                displayValue /= 60;
                displayValue = Math.round(displayValue);
            } else if (this.station.interval < 86400) {
                // hours
                this.currentUnit = 2;
                displayValue /= 3600;
                displayValue = Math.round(displayValue);
            } else if (this.station.interval < 604800) {
                // days
                this.currentUnit = 3;
                displayValue /= 86400;
                displayValue = Math.round(displayValue);
            } else {
                // weeks
                this.currentUnit = 4;
                displayValue /= 604800;
                displayValue = Math.round(displayValue);
            }
            this.displayInterval = displayValue;
        },

        convertToSeconds() {
            switch (this.currentUnit) {
                case 0:
                    this.station.interval = this.displayInterval;
                    break;
                case 1:
                    this.station.interval = this.displayInterval * 60;
                    break;
                case 2:
                    this.station.interval = this.displayInterval * 3600;
                    break;
                case 3:
                    this.station.interval = this.displayInterval * 86400;
                    break;
                case 4:
                    this.station.interval = this.displayInterval * 604800;
                    break;
                default:
                    break;
            }
        },

        checkInterval() {
            // reset these first
            this.noInterval = false;
            this.intervalNotNumber = false;
            // then check
            this.noInterval =
                !this.displayInterval ||
                this.displayInterval == 0 ||
                this.displayInterval.length == 0;
            if (this.noInterval) {
                return false;
            }
            this.intervalNotNumber = isNaN(this.displayInterval);
            return !this.intervalNotNumber;
        },

        saveInterval() {
            let valid = this.checkInterval();
            if (valid) {
                this.convertToSeconds(); // assigns displayInterval to this.station.interval
                if (this.origInterval != this.station.interval) {
                    // send to station
                    queryStation.setInterval(this.station).then(result => {
                        // console.log("sent interval and received", result);
                    });

                    // save to database
                    dbInterface.setStationInterval(this.station);
                    this.origInterval = this.station.interval;
                    this.origUnit = this.currentUnit;
                }
            }
        },

        onSelectedIndexChanged(event) {
            // console.log(event.oldIndex, event.newIndex)
            this.currentUnit = event.newIndex;
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
    padding-bottom: 40;
    padding-left: 20;
    padding-right: 20;
}

#interval-field {
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

.inner-border {
    margin-top: 30;
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
}

.validation-error {
    font-size: 12;
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
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
</style>
