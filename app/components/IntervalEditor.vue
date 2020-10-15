<template>
    <GridLayout rows="auto,auto,auto" columns="*,*" class="interval-editor">
        <StackLayout row="0" col="0" class="start-container" v-if="!fullDay">
            <TimeField :value="interval.start" label="Start" @change="(time) => onChangeStart(time)" />
        </StackLayout>

        <StackLayout row="0" col="1" class="end-container" v-if="!fullDay">
            <TimeField :value="interval.end" label="End" @change="(time) => onChangeEnd(time)" />
        </StackLayout>

        <StackLayout row="1" col="0" class="field-container">
            <Label text="Every" class="size-12 field-label" />

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
            <Label
                v-if="errors.quantity.minimum"
                class="validation-error"
                horizontalAlignment="left"
                :text="'A minimum of 1 minute is required.'"
                textWrap="true"
            />
        </StackLayout>
        <StackLayout row="1" col="1" class="duration-container" verticalAlignment="bottom">
            <DropDown
                class="drop-down"
                :items="items"
                :selectedIndex="indexOf(form.duration)"
                @selectedIndexChanged="onDurationChange"
                v-if="items"
            />
        </StackLayout>

        <StackLayout row="2" colSpan="2" class="summary-container" v-if="false">
            <Label :text="summary" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { ValueList } from "nativescript-drop-down";
import TimeField from "./TimeFieldModalPicker.vue";
import { Interval } from "@/store/types";

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
        fullDay: {
            type: Boolean,
            default: false,
        },
    },
    data(): {
        focus: boolean;
        durations: { display: string; value: number; duration: number }[];
        items: any;
        form: { quantity: string; duration: number };
        errors: { quantity: { required: boolean; numeric: boolean; minimum: boolean } };
    } {
        const durations = [
            { display: "Minutes", value: 60, duration: 60 },
            { display: "Hours", value: 60 * 60, duration: 60 * 60 },
        ];
        return {
            focus: false,
            durations: durations,
            items: null,
            form: {
                quantity: "1",
                duration: 60,
            },
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
        fieldClass(): string {
            return ["labeled-text-field", "input", this.focus ? "active-line" : "inactive-line"].join(" ");
        },
        summary(): string {
            return "every";
        },
    },
    mounted(): void {
        console.log("interval-editor:mounted", JSON.stringify(this.interval), this.fullDay);
        this.items = new ValueList(this.durations);
        this.updateForm(this.interval);
    },
    methods: {
        updateForm(interval: Interval): void {
            console.log("interval-editor:updating", JSON.stringify(interval));
            const minutes = interval.interval / 60;
            if (minutes >= 60) {
                this.form.duration = 3600;
            }
            this.form.quantity = String(Math.ceil(interval.interval / this.form.duration));
            console.log("interval-editor:updated", JSON.stringify(this.form));
        },
        onChange(ev: any): void {
            this.errors.quantity.numeric = false;
            this.errors.quantity.required = false;
            this.errors.quantity.minimum = false;

            if (!this.form.quantity || this.form.quantity.length == 0) {
                this.errors.quantity.required = true;
                return;
            }

            const numeric = Number(this.form.quantity);
            if (isNaN(numeric)) {
                this.errors.quantity.numeric = true;
                return;
            }

            const seconds = numeric * this.form.duration;
            if (seconds < 60) {
                this.errors.quantity.minimum = true;
                return;
            }

            const newInterval = {
                start: this.interval.start,
                end: this.interval.end,
                interval: seconds,
            };

            console.log("interval-editor:seconds", JSON.stringify(newInterval));
            this.$emit("change", newInterval);
        },
        onChangeStart(time: number): void {
            const newInterval = {
                start: time,
                end: this.interval.end,
                interval: this.interval.interval,
            };

            console.log("interval-editor:start", JSON.stringify(newInterval));
            this.$emit("change", newInterval);
        },
        onChangeEnd(time: number): void {
            const newInterval = {
                start: this.interval.start,
                end: time,
                interval: this.interval.interval,
            };

            console.log("interval-editor:end", JSON.stringify(newInterval));
            this.$emit("change", newInterval);
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
                this.form.quantity = ev.value;
                return this.onChange(fireChange);
            }
        },
        onDurationChange(ev, ...args): void {
            this.form.duration = this.durations[ev.newIndex].duration;
            return this.onChange(true);
        },
        indexOf(duration: number): number {
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

.interval-editor {
    /* background: #ffffaa; */
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
</style>
