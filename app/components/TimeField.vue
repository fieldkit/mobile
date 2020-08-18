<template>
    <StackLayout>
        <Label :text="label" class="size-12 field-label" />
        <TimePicker
            :hour="form.hour"
            :minute="form.minute"
            maxHour="23"
            maxMinute="59"
            @timeChange="onTimeChanged"
            @loaded="onPickerLoaded"
        />
    </StackLayout>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { isAndroid, isIOS } from "tns-core-modules/platform";
import { TimePicker } from "tns-core-modules/ui/time-picker";

interface Self {
    value: number;
    form: { hour: number; minute: number };
    updateDisplay: () => any;
    $emit: (type: string, value: number) => any;
}

export default Vue.extend({
    name: "TimeField",
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
    data() {
        return {
            form: {
                hour: 0,
                minute: 0,
            },
            errors: {
                required: false,
                format: false,
            },
        };
    },
    mounted(this: Self) {
        this.updateDisplay();
    },
    watch: {
        value() {
            this.updateDisplay();
        },
    },
    methods: {
        onPickerLoaded(this: Self, args: any) {
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
        updateDisplay(this: Self) {
            let hour = this.value / 60 / 60;
            let minute = (this.value / 60) % 60;
            if (hour > 23) {
                hour = 23;
                minute = 59;
            }
            this.form.hour = hour;
            this.form.minute = minute;
            console.log("time-field:update-display", this.value, this.form);
        },
        onTimeChanged(this: Self, ev: any) {
            const time = ev.value;
            console.log("time-field:time-change", time.getHours(), time.getMinutes());
            this.$emit("change", time.getHours() * 60 * 60 + time.getMinutes() * 60);
        },
    },
});
</script>

<style lang="scss">
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
