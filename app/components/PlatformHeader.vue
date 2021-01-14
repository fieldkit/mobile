<template>
    <ActionBar backgroundColor="orange" flat="true">
        <template v-if="ios">
            <template v-if="canNavigateSettings">
                <NavigationButton text="Back" :visibility="haveBackStack ? 'visible' : 'collapse'" @tap="raiseBack" />
                <GridLayout rows="auto,auto" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
                <ActionItem ios.systemIcon="2" ios.position="right" android.systemIcon="ic_menu_edit" @tap="onSettings" />
            </template>
            <template v-else>
                <NavigationButton text="Back" :visibility="haveBackStack ? 'visible' : 'collapse'" @tap="raiseBack" />
                <GridLayout rows="auto,auto" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
            </template>
        </template>
        <template v-else>
            <GridLayout rows="auto" columns="15*,70*,15*" :class="classes">
                <StackLayout v-if="haveBackStack" col="0" class="round-bkgd" @tap="raiseBack">
                    <Image width="21" src="~/images/Icon_Backarrow.png"></Image>
                </StackLayout>
                <GridLayout col="1" rows="auto,auto" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center" :text="title" textWrap="true"></Label>
                    <Label row="1" class="text-center subtitle" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
                <StackLayout v-if="!icon && canCancel" col="2" class="round-bkgd" @tap="raiseCancel">
                    <Image width="21" src="~/images/Icon_Close.png"></Image>
                </StackLayout>
                <StackLayout v-if="!icon && canNavigateSettings" col="2" class="round-bkgd" @tap="onSettings">
                    <Image width="25" src="~/images/Icon_Congfigure.png"></Image>
                </StackLayout>
                <StackLayout v-if="icon" col="2" class="round-bkgd" @tap="raiseIcon">
                    <Image width="25" :src="icon"></Image>
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
            type: Function as PropType<(ev: unknown) => void>,
            default: (_ev: unknown) => {
                Frame.topmost().goBack();
            },
        },
        onCancel: {
            type: Function as PropType<(ev: unknown) => void>,
            default: (_ev: unknown) => {
                // noop
            },
        },
        onSettings: {
            type: Function as PropType<(ev: unknown) => void>,
            default: (_ev: unknown) => {
                // noop
            },
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
        icon: {
            type: String,
            default: null,
            required: false,
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
            if (this.ios) c.push("ios");
            if (!this.ios) c.push("android");
            return c.join(" ");
        },
        haveBackStack(): boolean {
            const frame = Frame.topmost();
            if (!this.canNavigateBack) {
                return false;
            }
            if (frame) {
                console.log("platform-header:backStack", frame.id, frame.backStack.length);
                return true; // frame.backStack.length > 0;
            }
            return true;
        },
    },
    mounted(): void {
        // https://docs.nativescript.org/ui/action-bar
        console.log("platform-header:mounted", "ios", this.ios, "settings", this.canNavigateSettings, "back", this.canNavigateBack);
        // https://docs.nativescript.org/api-reference/classes/_ui_frame_.frame.html
        const frame = Frame.topmost();
        if (frame) {
            console.log("platform-header:backStack", frame.id, frame.backStack.length);
        }
    },
    methods: {
        raiseBack(ev): void {
            console.log("platform-header:back");
            this.$emit("back");
            if (this.onBack) {
                this.onBack(ev);
            } else {
                this.$navigateBack();
            }
        },
        raiseCancel(ev): void {
            console.log("platform-header:cancel");
            this.$emit("cancel");
            if (this.onCancel) {
                this.onCancel(ev);
            } else {
                this.$navigateBack();
            }
        },
        raiseIcon(): void {
            console.log("platform-header:icon-tapped");
            this.$emit("icon-tapped");
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
