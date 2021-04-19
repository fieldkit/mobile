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
        <StackLayout row="1">
            <Button
                class="btn btn-primary btn-padded"
                :text="buttonLabel"
                :isEnabled="buttonEnabled"
                @tap="onButton"
                v-if="buttonVisible"
            />
            <Label v-if="helpLabel" :text="helpLabel" class="guide" textWrap="true" @tap="onHelp" />
            <Label v-if="skipLabel" :text="skipLabel" class="skip" textWrap="true" @tap="onSkip" />
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

.skip {
    padding-top: 10;
    padding-bottom: 10;
    font-size: 14;
    font-weight: bold;
    text-align: center;
    // background-color: blue;
}

.btn-primary {
    margin-bottom: 0;
}

.guide {
    padding-top: 10;
    padding-bottom: 10;
    font-size: 14;
    font-weight: bold;
    text-align: center;
    // background-color: orange;
}

.ns-ios .guide {
    padding-top: 20;
    padding-bottom: 20;
}

.ns-ios .skip {
    // background-color: orange;
    padding-top: 20;
    padding-bottom: 20;
}

GridLayout {
    // background-color: orange;
}
</style>
