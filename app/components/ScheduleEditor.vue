<template>
    <StackLayout verticalAlignment="top" class="schedule-editor">
        <GridLayout rows="auto" columns="*,*" class="schedule-options" v-if="complex">
            <StackLayout column="0" class="option" @tap="(ev) => changeScheduleType(ev, 0)" v-bind:class="{ selected: isSimple }">
                <Label text="Simple" />
            </StackLayout>
            <StackLayout column="1" class="option" @tap="(ev) => changeScheduleType(ev, 1)" v-bind:class="{ selected: isComplex }">
                <Label text="Complex" />
            </StackLayout>
        </GridLayout>

        <StackLayout class="simple-schedule-container" v-if="isSimple">
            <IntervalEditor
                :interval="schedule.intervals[0]"
                :fullDay="true"
                :enabled="enabled"
                @change="(interval) => onChangeInterval(0, interval)"
                @invalid="(value) => onInvalid(0, value)"
            />
        </StackLayout>

        <StackLayout class="complex-schedule-container" v-if="isComplex">
            <StackLayout v-for="(interval, index) in schedule.intervals" :key="index" class="interval-container">
                <GridLayout rows="auto" columns="*,30" class="interval-header">
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

                <IntervalEditor
                    :interval="interval"
                    :enabled="enabled"
                    @change="(interval) => onChangeInterval(index, interval)"
                    @invalid="(value) => onInvalid(index, value)"
                />
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
import { Schedule, Interval } from "@/store";

export default Vue.extend({
    name: "ScheduleEditor",
    components: {
        IntervalEditor,
    },
    props: {
        schedule: {
            type: Object as () => Schedule,
            required: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        complex: {
            type: Boolean,
            default: true,
        },
    },
    data(): {
        scheduleType: number;
        invalid: { [scheduleType: number]: { [index: number]: boolean } };
    } {
        const invalid = {};
        invalid[0] = {};
        invalid[1] = {};
        return {
            scheduleType: 0,
            invalid: invalid,
        };
    },
    computed: {
        isSimple(): boolean {
            return this.scheduleType == 0;
        },
        isComplex(): boolean {
            return this.scheduleType == 1;
        },
        canRemove(): boolean {
            return this.schedule.intervals.length > 1;
        },
    },
    mounted(): void {
        console.log("schedule-editor:mounted", this.schedule, this.enabled);
        if (this.schedule.intervals.length == 0) throw new Error("one schedule interval required");
        this.scheduleType = this.isScheduleSimple(this.schedule) ? 0 : 1;
    },
    methods: {
        isScheduleSimple(schedule: Schedule): boolean {
            if (schedule.intervals.length > 1) return false;
            const interval = schedule.intervals[0];
            if (interval.start != 0) return false;
            if (interval.end < 86400 - 60) return false;
            return true;
        },
        changeScheduleType(ev: any, scheduleType: number): void {
            this.scheduleType = scheduleType;
        },
        addInterval(): void {
            const newSchedule = _.clone(this.schedule);
            newSchedule.intervals.push(new Interval(0, 86400, 60));
            console.log("add-interval", JSON.stringify(newSchedule));
            this.$emit("change", newSchedule);
        },
        removeInterval(interval: Interval): void {
            const newSchedule = _.clone(this.schedule);
            newSchedule.intervals = _.without(newSchedule.intervals, interval);
            console.log("remove-interval", JSON.stringify(newSchedule));
            this.$emit("change", newSchedule);
        },
        onChangeInterval(index: number, interval: Interval): void {
            const newSchedule = _.clone(this.schedule);
            newSchedule.intervals[index] = interval;
            console.log("change-interval", JSON.stringify(newSchedule));
            this.$emit("change", newSchedule);
        },
        onInvalid(index: number, invalid: boolean): void {
            this.invalid[this.scheduleType][index] = invalid;
            console.log("schedule-invalid", index, invalid, this.scheduleType, this.invalid);
            const flags = Object.values(this.invalid[this.scheduleType]);
            this.$emit("invalid", _.some(flags));
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
.complex-schedule-container {
    /* background: #efafaf; */
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
    background: #8de9ef;
	*/
}
.interval-header {
    padding-bottom: 10;
    /* background: #23ff44; */
}
</style>
