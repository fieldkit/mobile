<template>
    <StackLayout>
        <Label :text="label" class="size-12 field-label" @tap="showPicker" />
        <Label :text="display" class="size-18 field-value" @tap="showPicker" />
    </StackLayout>
</template>

<script lang="ts">
import _ from "lodash";
import moment from "moment";
import Vue from "vue";
import TimeFieldPicker from "./TimeFieldPicker.vue";

interface Self {
    value: number;
    $emit: (type: string, value: number) => any;
    $showModal: (c: any, params: any) => Promise<any>;
}

export default Vue.extend({
    name: "TimeFieldModalPicker",
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
        return {};
    },
    computed: {
        display(this: Self): string {
            let displayValue = this.value;
            if (displayValue >= 86400) {
                displayValue = 86400 - 60;
            }
            const duration = moment.duration(displayValue, "seconds");
            return moment.utc(duration.asMilliseconds()).format("HH:mm");
        },
    },
    methods: {
        showPicker(this: Self, ev: any) {
            return this.$showModal(TimeFieldPicker, {
                props: {
                    value: this.value,
                },
            }).then((time, ...args) => {
                if (time) {
                    console.log("time-field:time-change", time);
                    this.$emit("change", time);
                }
            });
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

.field-value {
}

/*
TimePicker,
Spinner {
    background: #afafef;
}
*/
</style>
