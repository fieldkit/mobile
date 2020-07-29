<template>
    <StackLayout verticalAlignment="top" class="schedule-editor">
        <Label :text="_L('dataCaptureSchedule')" class="size-12 header" />
        <GridLayout rows="auto" columns="*,*" class="simple-interval-container">
            <StackLayout row="0" col="0">
                <TextField
                    :text="form.quantity"
                    :class="fieldClass"
                    verticalAligment="bottom"
                    keyboardType="number"
                    autocorrect="false"
                    autocapitalizationType="none"
                    @focus="onFocus"
                    @textChange="onQuantityChange"
                    @blur="onBlur"
                />
                <Label
                    v-if="errors.quantity.required"
                    class="validation-error"
                    horizontalAlignment="left"
                    :text="_L('intervalRequired')"
                    textWrap="true"
                />
                <Label
                    v-if="errors.quantity.numeric"
                    class="validation-error"
                    horizontalAlignment="left"
                    :text="_L('intervalNotNumber')"
                    textWrap="true"
                />
            </StackLayout>
            <StackLayout row="0" col="1">
                <DropDown
                    :items="items"
                    :selectedIndex="indexOf(form.duration)"
                    class="p-l-5 p-b-2 size-18 drop-down"
                    @selectedIndexChanged="onDurationChange"
                />
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { ValueList } from "nativescript-drop-down";

export default Vue.extend({
    data() {
        const durations = [
            { display: "Minutes", value: 60, duration: 60 },
            { display: "Hours", value: 60 * 60, duration: 60 * 60 },
        ];
        return {
            focus: false,
            durations: durations,
            items: new ValueList(durations),
            form: {
                quantity: "1",
                duration: 60,
            },
            errors: {
                quantity: {
                    required: false,
                    numberic: false,
                },
            },
        };
    },
    props: {
        schedule: {
            type: Object,
            required: true,
        },
    },
    computed: {
        fieldClass(this: any) {
            return ["labeled-text-field", "input", this.focus ? "active-line" : "inactive-line"].join(" ");
        },
    },
    mounted(this: any) {
        console.log("mounted!", this.schedule);
        return this.updateForm(this.schedule);
    },
    methods: {
        updateForm(this: any, schedule) {
            console.log("updateForm", schedule);
            const minutes = schedule.interval / 60;
            if (minutes >= 60) {
                this.form.duration = 3600;
            }
            this.form.quantity = String(Math.ceil(schedule.interval / this.form.duration));
            console.log("updated", this.form);
        },
        onChange(this: any, ev) {
            console.log("onChange", this.form.quantity, this.form.duration, this.form);

            this.errors.quantity.numeric = false;
            this.errors.quantity.required = false;

            if (!this.form.quantity || this.form.quantity.length == 0) {
                this.errors.quantity.required = true;
                return;
            }

            const numeric = Number(this.form.quantity);
            if (isNaN(numeric)) {
                this.errors.quantity.numeric = true;
                return;
            }

            const interval = numeric * this.form.duration;
            const schedule = {
                duration: this.form.duration,
                quantity: numeric,
                interval: interval,
            };
            console.log("schedule-change", schedule);
            this.$emit("change", schedule);
        },
        onFocus(this: any) {
            this.focus = true;
        },
        onBlur(this: any) {
            this.focus = false;
            this.onQuantityChange(true);
        },
        onQuantityChange(this: any, ev, fireChange: boolean) {
            // value is undefined for onBlur
            if (ev && ev.value) {
                this.form.quantity = ev.value;
                return this.onChange(fireChange);
            }
        },
        onDurationChange(this: any, ev, ...args) {
            this.form.duration = this.durations[ev.newIndex].duration;
            return this.onChange(true);
        },
        indexOf(this: any, duration: number) {
            for (let v of this.durations) {
                if (v.duration === duration) {
                    return this.durations.indexOf(v);
                }
            }
            return 0;
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.schedule-editor {
}
.simple-interval-container {
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
.inactive-line {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}
.active-line {
    border-bottom-color: $fk-secondary-blue;
    border-bottom-width: 2;
}
</style>
