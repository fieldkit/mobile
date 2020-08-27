<template>
    <ActionBar backgroundColor="white" flat="true">
        <template v-if="ios">
            <GridLayout rows="auto" columns="15*,70*,15*" :class="classes">
                <GridLayout col="1" rows="auto,auto" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center" :text="title" textWrap="true"></Label>
                    <Label row="1" class="text-center subtitle" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
            </GridLayout>
            <ActionItem
                @tap="onSettings"
                ios.systemIcon="2"
                ios.position="right"
                android.systemIcon="ic_menu_edit"
                v-if="canNavigateSettings"
            />
        </template>
        <template v-else>
            <GridLayout rows="auto" columns="15*,70*,15*" :class="classes">
                <StackLayout col="0" class="round-bkgd" @tap="raiseBack" v-if="canNavigateBack">
                    <Image width="21" src="~/images/Icon_Backarrow.png"></Image>
                </StackLayout>
                <GridLayout col="1" rows="auto,auto" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center" :text="title" textWrap="true"></Label>
                    <Label row="1" class="text-center subtitle" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
                <StackLayout col="2" class="round-bkgd" @tap="raiseCancel" v-if="canCancel">
                    <Image width="21" src="~/images/Icon_Close.png"></Image>
                </StackLayout>
                <StackLayout col="2" class="round-bkgd" @tap="onSettings" v-if="canNavigateSettings">
                    <Image width="25" src="~/images/Icon_Congfigure.png"></Image>
                </StackLayout>
            </GridLayout>
        </template>
    </ActionBar>
</template>
<script lang="ts">
import Vue from "vue";
import { isIOS } from "tns-core-modules/platform";

export default Vue.extend({
    name: "PlatformHeader",
    data: () => {
        return {
            ios: isIOS,
        };
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        subtitle: {
            type: String,
            default: null,
        },
        onBack: {
            type: Function,
            default: () => {},
        },
        onCancel: {
            type: Function,
            default: () => {},
        },
        onSettings: {
            type: Function,
            default: () => {},
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
    computed: {
        classes(this: any): string {
            const c: string[] = [];
            if (this.bottomMargin || this.ios) c.push("m-b-20");
            if (this.actionBar) c.push("header-container");
            if (this.ios) c.push("ios");
            if (!this.ios) c.push("android");
            return c.join(" ");
        },
    },
    mounted() {
        console.log("screen-header:mounted", this.subtitle);
    },
    methods: {
        raiseBack(this: any, ev) {
            console.log("ScreenHeader:back");
            this.$emit("back");
            this.onBack(ev);
        },
        raiseCancel(this: any, ev) {
            console.log("ScreenHeader:cancel");
            this.$emit("cancel");
            this.onCancel(ev);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.android.header-container {
    padding-top: 15;
}
</style>
