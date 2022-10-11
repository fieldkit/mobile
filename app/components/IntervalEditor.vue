<template>
    <GridLayout rows="auto,auto,auto" columns="*,*" class="interval-editor">
        <StackLayout row="0" col="0" class="start-container" v-if="!fullDay">
            <TimeField :value="interval.start" :label="_L('schedules.editor.start')" @change="(time) => onChangeStart(time)" />
        </StackLayout>

        <StackLayout row="0" col="1" class="end-container" v-if="!fullDay">
            <TimeField :value="interval.end" :label="_L('schedules.editor.end')" @change="(time) => onChangeEnd(time)" />
        </StackLayout>

        <StackLayout row="1" col="0" class="field-container">
            <Label :text="_L('schedules.editor.every')" class="size-12 field-label" />

            <TextField
                :text="form.quantity"
                :class="fieldClass"
                verticalAligment="bottom"
                :keyboardType="keyboardType"
                autocorrect="false"
                autocapitalizationType="none"
                v-if="enabled"
                @focus="onFocus"
                @textChange="onQuantityChange"
                @blur="onBlur"
            />
            <Label :text="form.quantity" :class="fieldClass" verticalAligment="bottom" v-else />
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
            <Label
                v-if="errors.quantity.minimum"
                class="validation-error"
                horizontalAlignment="left"
                :text="'A minimum of 1 minute is required.'"
                textWrap="true"
            />
        </StackLayout>
        <FlexboxLayout row="1" col="1" class="duration-container" verticalAlignment="bottom">
            <Button
                :text="_L('minutes')"
                :class="form.duration == 60 ? 'duration-button duration-button-selected' : 'duration-button'"
                @tap="onDurationChange(60)"
            />
            <Button
                :text="_L('hours')"
                :class="form.duration == 3600 ? 'duration-button duration-button-selected' : 'duration-button'"
                @tap="onDurationChange(3600)"
            />
        </FlexboxLayout>
    </GridLayout>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import TimeField from "./TimeFieldModalPicker.vue";
import { Interval } from "@/store/types";
import { isIOS } from "@nativescript/core";
import { debug } from "@/lib";

interface IntervalForm {
    duration: number;
    quantity: string;
}

function getStartingForm(interval: Interval): IntervalForm {
    const minutes = interval.interval / 60;
    if (minutes >= 60) {
        return {
            duration: 3600,
            quantity: String(interval.interval / 3600),
        };
    }
    return {
        duration: 60,
        quantity: String(minutes),
    };
}

export default Vue.extend({
    name: "IntervalEditor",
    components: {
        TimeField,
    },
    props: {
        interval: {
            type: Object as () => Interval,
            required: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        fullDay: {
            type: Boolean,
            default: false,
        },
    },
    data(): {
        focus: boolean;
        form: { quantity: string; duration: number };
        errors: { quantity: { required: boolean; numeric: boolean; minimum: boolean } };
    } {
        debug.log(`schedule-interval-data: ${JSON.stringify(this.interval)}`);
        return {
            focus: false,
            form: getStartingForm(this.interval),
            errors: {
                quantity: {
                    required: false,
                    numeric: false,
                    minimum: false,
                },
            },
        };
    },
    computed: {
        keyboardType(): string {
            if (isIOS) {
                return "number";
            }
            return "";
        },
        fieldClass(): string {
            return ["labeled-text-field", "input", this.focus ? "active-line" : "inactive-line"].join(" ");
        },
        summary(): string {
            return "every";
        },
    },
    mounted(): void {
        debug.log("schedule-interval:mounted", JSON.stringify(this.interval), this.fullDay, this.enabled);
    },
    methods: {
        updateInvalid(): void {
            const invalid = this.errors.quantity.numeric || this.errors.quantity.required || this.errors.quantity.minimum;
            this.$emit("invalid", invalid);
        },
        onChange(ev: any): void {
            debug.log(`schedule-interval:change ${JSON.stringify(this.form)}`);

            this.errors.quantity.numeric = false;
            this.errors.quantity.required = false;
            this.errors.quantity.minimum = false;

            if (!this.form.quantity || this.form.quantity.length == 0) {
                this.errors.quantity.required = true;
                this.updateInvalid();
                return;
            }

            const numeric = Number(this.form.quantity);
            if (isNaN(numeric)) {
                this.errors.quantity.numeric = true;
                this.updateInvalid();
                return;
            }

            const seconds = numeric * this.form.duration;
            if (seconds < 60) {
                this.errors.quantity.minimum = true;
                this.updateInvalid();
                return;
            }

            const newInterval = {
                start: this.interval.start,
                end: this.interval.end,
                interval: seconds,
            };

            debug.log(`schedule-interval:seconds: ${JSON.stringify(newInterval)}`);
            this.$emit("change", newInterval);
            this.updateInvalid();
        },
        onChangeStart(time: number): void {
            const newInterval = {
                start: time,
                end: this.interval.end,
                interval: this.interval.interval,
            };

            debug.log(`schedule-interval:start: ${JSON.stringify(newInterval)}`);
            this.$emit("change", newInterval);
            this.updateInvalid();
        },
        onChangeEnd(time: number): void {
            const newInterval = {
                start: this.interval.start,
                end: time,
                interval: this.interval.interval,
            };

            debug.log(`schedule-interval:end: ${JSON.stringify(newInterval)}`);
            this.$emit("change", newInterval);
            this.updateInvalid();
        },
        onFocus(): void {
            this.focus = true;
        },
        onBlur(): void {
            this.focus = false;
            this.onChange(true);
        },
        onQuantityChange(ev, fireChange: boolean): void {
            // value is undefined for onBlur
            if (ev && ev.value) {
                if (this.form.quantity != ev.value) {
                    this.form.quantity = ev.value;
                    debug.log(`schedule-interval:quantity: ${JSON.stringify(this.form)}`);
                    return this.onChange(fireChange);
                }
            }
        },
        onDurationChange(duration: number): void {
            if (duration != this.form.duration) {
                this.form.duration = duration;
                return this.onChange(true);
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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

.start-container {
    /* background: #efafaf; */
    padding-bottom: 10;
}
.end-container {
    /* background: #afefaf; */
    padding-bottom: 10;
}
.field-container {
    /* background: #afefef; */
}
.duration-container {
    /* background: #afafef; */
    padding: 5;
}

.field-label {
    text-align: left;
    font-size: 14;
}

.drop-down {
    padding: 10;
    font-size: 16;
    text-align: center;
}

.duration-button {
    background: #efefef;
    font-size: 12;
}

.duration-button-selected {
    background: $fk-primary-red;
}

.ns-ios .duration-button {
    padding: 10;
    margin-right: 10;
}

.ns-ios .field-label {
    padding: 10;
}

.ns-ios .labeled-text-field {
    padding: 10;
}
</style>
