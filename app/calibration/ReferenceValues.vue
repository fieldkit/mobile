<template>
    <StackLayout>
        <StackLayout v-for="(ref, index) in form.references" :key="index" class="reference-container">
            <Label col="1" class="m-t-5 m-l-5 heading" :text="_L(ref.label)" textWrap="true" />

            <TextField v-model="ref.value" autocorrect="false" autocapitalizationType="none" @textChange="onChange(ref)" />

            <Label v-show="!ref.valid" class="validation-error" horizontalAlignment="left" text="A number is required." textWrap="true" />
        </StackLayout>
    </StackLayout>
</template>
<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import Header from "./Header.vue";
import { CalibrationStrategy, CalibrationValue } from "./model";
import { AtlasCalValue } from "./water";
import { required, decimal } from "vuelidate/lib/validators";

class ReferenceForm {
    public value: string;
    public label: string;
    public valid: boolean;
    public range: [number, number];

    constructor(public readonly calibrationValue: CalibrationValue) {
        const calValue = <AtlasCalValue>calibrationValue;
        this.value = `${calValue.reference}`;
        this.label = calValue.label;
        this.range = calValue.range;
        this.valid = true;
    }

    public touch(): boolean {
        const isNumeric = required(this.value) && decimal(this.value);
        if (isNumeric) {
            const numeric = Number(this.value);
            this.valid = numeric >= this.range[0] && numeric <= this.range[1];
        } else {
            this.valid = false;
        }
        return this.valid;
    }

    public toCalValue(): CalibrationValue {
        if (!this.valid) throw new Error("toCalValue: invalid value");
        const calValue = <AtlasCalValue>this.calibrationValue;
        return new AtlasCalValue(Number(this.value), this.range, calValue.command);
    }
}

class Form {
    public valid = true;

    constructor(public readonly references: ReferenceForm[]) {}

    public touch(): boolean {
        this.valid = this.references.filter((r) => !r.touch()).length == 0;
        return this.valid;
    }
}

export default Vue.extend({
    name: "ReferenceValues",
    components: {
        Header,
    },
    props: {
        strategy: {
            type: CalibrationStrategy,
            required: true,
        },
    },
    data(): {
        form: Form;
    } {
        return {
            form: new Form([]),
        };
    },
    mounted(): void {
        console.log("cal:", "strategy", this.strategy, this.strategy.references);
        this.form = new Form(this.strategy.references.map((r) => new ReferenceForm(r.value)));
    },
    methods: {
        onChange(reference: ReferenceForm): void {
            if (this.form.touch()) {
                console.log(`on-change: ${JSON.stringify(reference)}`);
                this.$emit(
                    "changed",
                    this.form.references.map((r) => r.toCalValue())
                );
            } else {
                this.$emit("changed", null);
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.validation-error {
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
}
</style>
