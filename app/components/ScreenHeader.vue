<template>
    <GridLayout rows="auto" columns="15*,70*,15*" :class="classes">
        <StackLayout v-if="canNavigateBack" col="0" class="round-bkgd" @tap="raiseBack">
            <Image width="21" src="~/images/Icon_Backarrow.png"></Image>
        </StackLayout>
        <GridLayout col="1" rows="auto,auto" columns="*">
            <Label row="0" class="title m-t-10 m-b-5 text-center" :text="title" textWrap="true"></Label>
            <Label row="1" class="text-center subtitle" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
        </GridLayout>
        <StackLayout v-if="canCancel" col="2" class="round-bkgd" @tap="raiseCancel">
            <Image width="21" src="~/images/Icon_Close.png"></Image>
        </StackLayout>
        <StackLayout v-if="canNavigateSettings" col="2" class="round-bkgd" @tap="onSettings">
            <Image width="25" src="~/images/Icon_Congfigure.png"></Image>
        </StackLayout>
    </GridLayout>
</template>
<script lang="ts">
import Vue, { PropType } from "vue";
import { isIOS } from "@nativescript/core";

export default Vue.extend({
    name: "ScreenHeader",
    props: {
        actionBar: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            required: true,
        },
        subtitle: {
            type: String,
            default: null,
        },
        onBack: {
            type: Function as PropType<() => void>,
            default: () => {
                // noop
            },
        },
        onCancel: {
            type: Function as PropType<() => void>,
            default: () => {
                // noop
            },
        },
        onSettings: {
            type: Function as PropType<() => void>,
            default: () => {
                // noop
            },
        },
        canCancel: {
            type: Boolean,
            default: false,
        },
        canNavigateBack: {
            type: Boolean,
            default: true,
        },
        canNavigateSettings: {
            type: Boolean,
            default: true,
        },
        bottomMargin: {
            type: Boolean,
            default: true,
        },
    },
    data(): { ios: boolean } {
        return {
            ios: isIOS,
        };
    },
    computed: {
        classes(): string {
            const c: string[] = [];
            if (this.bottomMargin || this.ios) c.push("m-b-20");
            if (this.actionBar) c.push("header-container");
            return c.join(" ");
        },
    },
    mounted(): void {
        console.log("screen-header:mounted", this.subtitle);
    },
    methods: {
        raiseBack(_ev: Event): void {
            console.log("ScreenHeader:back");
            this.$emit("back");
            if (this.onBack) {
                this.onBack();
            }
        },
        raiseCancel(_ev: Event): void {
            console.log("ScreenHeader:cancel");
            this.$emit("cancel");
            if (this.onCancel) {
                this.onCancel();
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.header-container {
    padding-top: 15;
}
</style>
