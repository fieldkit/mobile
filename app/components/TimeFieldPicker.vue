<template>
    <StackLayout backgroundColor="white">
        <Label :text="label" class="size-12 field-label" />
        <TimePicker
            :hour="form.hour"
            :minute="form.minute"
            maxHour="23"
            maxMinute="59"
            @timeChange="onTimeChanged"
            @loaded="onPickerLoaded"
            iosPreferredDatePickerStyle="1"
        />
        <Button @tap="onSave">OK</Button>
    </StackLayout>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { isAndroid, isIOS } from "@nativescript/core";
import { TimePicker } from "@nativescript/core";

export default Vue.extend({
    name: "TimeFieldPicker",
    props: {
        value: {
            type: Number,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
    },
    data(): {
        form: {
            hour: number;
            minute: number;
            time: number;
        };
    } {
        return {
            form: {
                hour: 0,
                minute: 0,
                time: 0,
            },
        };
    },
    mounted(): void {
        this.updateDisplay();
    },
    watch: {
        value(): void {
            this.updateDisplay();
        },
    },
    methods: {
        onPickerLoaded(args: any): void {
            this.updateDisplay();

            // From: https://docs.nativescript.org/ui/components/time-picker
            const timePicker: TimePicker = <TimePicker>args.object;
            const globalAny = global as any;
            if (isAndroid) {
                timePicker.android.setIs24HourView(globalAny.java.lang.Boolean.TRUE);
                timePicker.hour = this.form.hour;
                timePicker.minute = this.form.minute;
            } else if (isIOS) {
                // A bit hacky solution, important set the country not the language for locale
                const local = globalAny.NSLocale.alloc().initWithLocaleIdentifier("NL");
                timePicker.ios.locale = local;
                timePicker.hour = this.form.hour;
                timePicker.minute = this.form.minute;
            }
        },
        updateDisplay(): void {
            let hour = this.value / 60 / 60;
            let minute = (this.value / 60) % 60;
            if (hour > 23) {
                hour = 23;
                minute = 59;
            }
            this.form.hour = hour;
            this.form.minute = minute;
            this.form.time = this.value;
            console.log("time-field:update-display", this.value, this.form);
        },
        onTimeChanged(ev: any): void {
            const date: Date = ev.value;
            const time = date.getHours() * 60 * 60 + date.getMinutes() * 60;
            console.log("time-field:time-change", date.getHours(), date.getMinutes());
            this.form.time = time;
            this.$emit("change", time);
        },
        onSave(): void {
            this.$modal.close(this.form.time);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.field-label {
    text-align: left;
    font-size: 14;
}

/*
TimePicker,
Spinner {
    background: #afafef;
}
*/
</style>
