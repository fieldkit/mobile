<template>
    <StackLayout class="labeled-text-view">
        <Label
            row="0"
            :text="label"
            class="m-x-20 m-y-10 size-12 field-label"
            :visibility="typing ? 'visible' : 'collapsed'"
            ref="label"
            width="100%"
        />
        <TextView
            row="1"
            :class="fieldClass"
            :hint="label"
            :text="value"
            :keyboardType="keyboardType"
            autocorrect="false"
            autocapitalizationType="none"
            @focus="onFocus"
            @textChange="onChange"
            @blur="onBlur"
        />
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { Enums } from "@nativescript/core";

export default Vue.extend({
    data(): { typing: boolean; focus: boolean } {
        return {
            typing: false,
            focus: true,
        };
    },
    props: {
        value: {
            type: String,
            default: "",
        },
        label: {
            type: String,
            default: "",
        },
        keyboardType: {
            type: String,
            default: "name",
        },
    },
    computed: {
        fieldClass(): string {
            return ["labeled-text-field", "input", this.focus ? "active-line" : "inactive-line"].join(" ");
        },
    },
    methods: {
        onFocus(ev: any): void {
            this.focus = true;
            this.$emit("focus", ev);
        },
        onChange(ev: any): void {
            const value = ev.value;
            if (!this.typing && value) {
                this.animateLabel((this.$refs.label as any).nativeView);
            } else if (!value) {
                this.typing = false;
            }
            this.$emit("input", ev.value);
        },
        onBlur(ev: any): void {
            this.focus = false;
            this.$emit("blur", ev);
        },
        animateLabel(nativeView: any): void {
            nativeView.opacity = 0;
            nativeView.translateX = 5;
            nativeView.translateY = 20;
            nativeView.animate({
                opacity: 0.75,
                translate: { x: 0, y: 0 },
                duration: 300,
                curve: Enums.AnimationCurve.easeIn,
            });
            this.typing = true;
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.labeled-text-view {
    .field-label {
        color: $fk-gray-hint;
    }

    .labeled-text-field {
        color: $fk-primary-black;
        padding-bottom: 5;
        width: 100%;
        font-size: 18;
    }
}
</style>
