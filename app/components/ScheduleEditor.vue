<template>
    <StackLayout verticalAlignment="top" class="schedule-editor">
        <Label :text="_L('dataCaptureSchedule')" class="size-14 title" />
        <Label text="Frequent data capture drains the battery at a quicker rate." class="size-12 subtitle" />

        <GridLayout rows="auto" columns="*,*" class="schedule-options">
            <StackLayout column="0" class="option" @tap="(ev) => changeScheduleType(ev, 0)" v-bind:class="{ selected: isSimple }">
                <Label text="Simple" />
            </StackLayout>
            <StackLayout column="1" class="option" @tap="(ev) => changeScheduleType(ev, 1)" v-bind:class="{ selected: isComplex }">
                <Label text="Complex" />
            </StackLayout>
        </GridLayout>

        <StackLayout class="simple-schedule-container" v-if="isSimple">
            <IntervalEditor :interval="schedule.intervals[0]" :fullDay="true" @change="(interval) => onChangeInterval(0, interval)" />
        </StackLayout>

        <StackLayout class="complex-schedule-container" v-if="isComplex">
            <StackLayout v-for="(interval, index) in schedule.intervals" :key="index" class="interval-container">
                <GridLayout columns="*,30" class="interval-header">
                    <Label :text="'Capture Time ' + (index + 1)" />
                    <StackLayout
                        col="1"
                        class="round-bkgd"
                        verticalAlignment="top"
                        @tap="(ev) => removeInterval(interval)"
                        v-if="canRemove"
                    >
                        <Image width="21" src="~/images/Icon_Close.png" />
                    </StackLayout>
                </GridLayout>
                <IntervalEditor :interval="interval" @change="(interval) => onChangeInterval(index, interval)" />
            </StackLayout>
            <StackLayout @tap="addInterval" class="add-interval">
                <Label text="Add Time" />
            </StackLayout>
        </StackLayout>
    </StackLayout>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import IntervalEditor from "./IntervalEditor.vue";
import { Interval } from "@/store/types";

export interface Schedule {
    intervals: Interval[];
}

interface Self {
    scheduleType: number;
    schedule: Schedule;
    isScheduleSimple: (s: Schedule) => boolean;
    $emit: (name, value) => {};
}

export default Vue.extend({
    name: "ScheduleEditor",
    components: {
        IntervalEditor,
    },
    props: {
        schedule: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            scheduleType: 0,
        };
    },
    computed: {
        isSimple(this: Self) {
            return this.scheduleType == 0;
        },
        isComplex(this: Self) {
            return this.scheduleType == 1;
        },
        canRemove(this: Self) {
            return this.schedule.intervals.length > 1;
        },
    },
    mounted(this: Self) {
        console.log("schedule-editor:mounted", this.schedule);
        this.scheduleType = this.isScheduleSimple(this.schedule) ? 0 : 1;
    },
    methods: {
        isScheduleSimple(this: Self, schedule: Schedule) {
            if (schedule.intervals.length > 1) return false;
            const interval = schedule.intervals[0];
            if (interval.start != 0) return false;
            if (interval.end < 86400 - 60) return false;
            return true;
        },
        changeScheduleType(this: Self, ev: any, scheduleType: number) {
            this.scheduleType = scheduleType;
        },
        addInterval(this: Self) {
            const newSchedule = _.clone(this.schedule);
            newSchedule.intervals.push(new Interval(0, 86400, 60));
            console.log("add-interval", JSON.stringify(newSchedule));
            this.$emit("change", newSchedule);
        },
        removeInterval(this: Self, interval: Interval) {
            const newSchedule = _.clone(this.schedule);
            newSchedule.intervals = _.without(newSchedule.intervals, interval);
            console.log("remove-interval", JSON.stringify(newSchedule));
            this.$emit("change", newSchedule);
        },
        onChangeInterval(this: Self, index: number, interval: Interval) {
            const newSchedule = _.clone(this.schedule);
            newSchedule.intervals[index] = interval;
            console.log("change-interval", JSON.stringify(newSchedule));
            this.$emit("change", newSchedule);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.schedule-editor {
}
.simple-schedule-container,
.complex-schedule-container {
    padding: 10;
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 5;
}
.validation-error {
    margin-right: 20;
    font-size: 12;
    color: $fk-tertiary-red;
    padding-top: 5;
}
.header {
    color: $fk-gray-hint;
}
.subtitle {
    margin-top: 5;
    margin-bottom: 5;
}

.schedule-options {
    margin: 10;
}
.schedule-options .option {
    text-align: center;
    padding: 10;
    border-radius: 10;
}
.schedule-options .option.selected {
    background: #000;
    color: #fff;
}

.remove-interval {
    padding: 10;
    /* background: #ee00ee; */
}
.add-interval {
    padding: 10;
    text-align: center;
    /* background: #af0000; */
}
.interval-container {
    padding-bottom: 10;
    /*
    border-bottom-color: $fk-primary-black;
    border-bottom-width: 1;
	*/
}
.interval-header {
    padding-bottom: 10;
}
</style>
