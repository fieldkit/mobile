<template>
    <ActionBar backgroundColor="white" flat="true">
        <template v-if="ios">
            <template v-if="canNavigateSettings">
                <NavigationButton text="Back" @tap="raiseBack" :visibility="haveBackStack ? 'visible' : 'collapse'" />
                <GridLayout rows="auto,auto" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
                <ActionItem @tap="onSettings" ios.systemIcon="2" ios.position="right" android.systemIcon="ic_menu_edit" />
            </template>
            <template v-else>
                <NavigationButton text="Back" @tap="raiseBack" :visibility="haveBackStack ? 'visible' : 'collapse'" />
                <GridLayout rows="auto,auto" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
            </template>
        </template>
        <template v-else>
            <GridLayout rows="auto" columns="15*,70*,15*" :class="classes">
                <StackLayout col="0" class="round-bkgd" @tap="raiseBack" v-if="haveBackStack">
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
import Vue, { PropType } from "vue";
import { Frame, isIOS } from "@nativescript/core";

export default Vue.extend({
    name: "PlatformHeader",
    data(): { ios: boolean } {
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
            type: Function as PropType<(ev: any) => void>,
            default: (ev: any) => {
                Frame.topmost().goBack();
            },
        },
        onCancel: {
            type: Function as PropType<(ev: any) => void>,
            default: (ev: any) => {},
        },
        onSettings: {
            type: Function as PropType<(ev: any) => void>,
            default: (ev: any) => {},
        },
        canCancel: {
            type: Boolean,
            default: false,
        },
        // Deprecated
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
        classes(): string {
            const c: string[] = [];
            if (this.bottomMargin || this.ios) c.push("m-b-20");
            if (this.ios) c.push("ios");
            if (!this.ios) c.push("android");
            return c.join(" ");
        },
        haveBackStack(): boolean {
            const frame = Frame.topmost();
            console.log("platform-header:backStack", frame.backStack.length);
            return frame.backStack.length > 0;
        },
    },
    mounted(): void {
        // https://docs.nativescript.org/ui/action-bar
        console.log("platform-header:mounted", this.ios, this.canNavigateSettings, this.canNavigateBack);
        // https://docs.nativescript.org/api-reference/classes/_ui_frame_.frame.html
        const frame = Frame.topmost();
        console.log("platform-header:backStack", frame.backStack.length);
    },
    methods: {
        raiseBack(ev): void {
            console.log("platform-header:back");
            this.$emit("back");
            if (this.onBack) {
                this.onBack(ev);
            }
        },
        raiseCancel(ev): void {
            console.log("platform-header:cancel");
            this.$emit("cancel");
            if (this.onCancel) {
                this.onCancel(ev);
            }
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
