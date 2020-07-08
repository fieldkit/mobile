<template>
    <StackLayout>
        <Label row="0" :text="label" class="m-x-20 m-y-10 size-12 field-label" :visibility="typing ? 'visible' : 'collapsed'" ref="label" width="100%" />
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

<script>
import { AnimationCurve } from "tns-core-modules/ui/enums";
import * as animations from "./animations";

export default {
    data() {
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
        fieldClass() {
            return ["labeled-text-field", "input", this.focus ? "active-line" : "inactive-line"].join(" ");
        },
    },
    methods: {
        onFocus(ev) {
            this.focus = true;
            this.$emit("focus", ev);
        },
        onChange(ev) {
            const value = ev.value;
            if (!this.typing && value) {
                this.animateLabel(this.$refs.label.nativeView);
            } else if (!value) {
                this.typing = false;
            }
            this.$emit("input", ev.value);
        },
        onBlur(ev) {
            this.focus = false;
            this.$emit("blur", ev);
        },
        animateLabel(nativeView) {
            nativeView.opacity = 0;
            nativeView.translateX = 5;
            nativeView.translateY = 20;
            nativeView.animate({
                opacity: 0.75,
                translate: { x: 0, y: 0 },
                duration: 300,
                curve: AnimationCurve.easeIn,
            });
            this.typing = true;
        },
    },
};
</script>

<style scoped lang="scss">
@import "../app-variables";

.field-label {
    color: $fk-gray-hint;
}
.labeled-text-field {
    color: $fk-primary-black;
    padding-bottom: 5;
    width: 100%;
    font-size: 18;
}
.validation-error {
    width: 100%;
    font-size: 12;
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
}
</style>
