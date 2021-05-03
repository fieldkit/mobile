<template>
    <GridLayout rows="*,auto">
        <ScrollView v-if="scrolling" row="0">
            <StackLayout>
                <slot></slot>
            </StackLayout>
        </ScrollView>
        <StackLayout v-else row="0">
            <slot></slot>
        </StackLayout>
        <StackLayout row="1" class="buttons-container">
            <Button
                v-if="buttonVisible"
                class="btn btn-primary btn-padded"
                :text="buttonLabel"
                :isEnabled="buttonEnabled"
                @tap="onButton"
            />
            <StackLayout class="buttons-small-container">
                <Label v-if="helpLabel" :text="helpLabel" class="help-label" textWrap="true" @tap="onHelp" />
                <Label v-if="skipLabel" :text="skipLabel" class="skip-label" textWrap="true" @tap="onSkip" />
            </StackLayout>
        </StackLayout>
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    name: "SkipLayout",
    props: {
        buttonLabel: {
            type: String,
            required: true,
        },
        buttonEnabled: {
            type: Boolean,
            default: true,
        },
        buttonVisible: {
            type: Boolean,
            default: true,
        },
        skipLabel: {
            type: String,
            default: null,
        },
        helpLabel: {
            type: String,
            default: null,
        },
        scrolling: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        onButton(): void {
            this.$emit("button");
        },
        onSkip(): void {
            this.$emit("skip");
        },
        onHelp(): void {
            this.$emit("help");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
@import "~/_app-common";
</style>
