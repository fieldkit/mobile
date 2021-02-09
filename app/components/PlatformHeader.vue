<template>
    <ActionBar backgroundColor="white" flat="true" class="action-bar">
        <template v-if="ios">
            <template v-if="canNavigateSettings">
                <NavigationButton text="Back" :visibility="haveBackStack ? 'visible' : 'collapse'" @tap="raiseBack" />
                <GridLayout :rows="subtitle ? 'auto,auto' : 'auto'" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
                <ActionItem ios.systemIcon="2" ios.position="right" android.systemIcon="ic_menu_edit" @tap="onSettings" />
            </template>
            <template v-else-if="canSave">
                <NavigationButton text="Back" :visibility="haveBackStack ? 'visible' : 'collapse'" @tap="raiseBack" />
                <GridLayout :rows="subtitle ? 'auto,auto' : 'auto'" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
                <ActionItem ios.systemIcon="3" ios.position="right" android.systemIcon="ic_menu_edit" @tap="raiseSave" />
            </template>
            <template v-else>
                <NavigationButton text="Back" :visibility="haveBackStack ? 'visible' : 'collapse'" @tap="raiseBack" />
                <GridLayout :rows="subtitle ? 'auto,auto' : 'auto'" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
            </template>
        </template>
        <template v-else>
            <GridLayout rows="auto" columns="15*,70*,15*" :class="classes">
                <StackLayout v-if="haveBackStack" col="0" class="back-icon" @tap="raiseBack">
                    <Image width="21" src="~/images/Icon_Backarrow.png"></Image>
                </StackLayout>
                <GridLayout col="1" :rows="subtitle ? 'auto,auto' : 'auto'" columns="*">
                    <Label row="0" class="title text-center" :text="title" textWrap="true"></Label>
                    <Label row="1" class="text-center subtitle" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
                <StackLayout v-if="!icon && canCancel" col="2" class="close-icon" @tap="raiseCancel">
                    <Image width="21" src="~/images/Icon_Close.png"></Image>
                </StackLayout>
                <StackLayout v-if="!icon && canNavigateSettings" col="2" class="configure-icon" @tap="onSettings">
                    <Image width="25" src="~/images/Icon_Congfigure.png"></Image>
                </StackLayout>
                <StackLayout v-if="icon" col="2" class="normal-icon" @tap="raiseIcon">
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
            default: null,
        },
        onCancel: {
            type: Function as PropType<(ev: unknown) => void>,
            default: null,
        },
        onSettings: {
            type: Function as PropType<(ev: unknown) => void>,
            default: null,
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
        canSave: {
            type: Boolean,
            default: false,
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
            // if (this.bottomMargin || this.ios) c.push("m-b-20");
            if (this.ios) c.push("ios");
            if (!this.ios) c.push("android");
            return c.join(" ");
        },
        haveBackStack(): boolean {
            if (!this.canNavigateBack) {
                return false;
            }
            const frame = Frame.topmost();
            if (frame) {
                console.log("platform-header:backStack", frame.id, frame.backStack.length);
                return true; // frame.backStack.length > 0;
            }
            return true;
        },
    },
    created(): void {
        /*
        if (application.android) {
            application.android.on(application.AndroidApplication.activityBackPressedEvent, (args: any) => {
                if (this.step > 0) {
                    args.cancel = true; //this cancels the normal backbutton behaviour
                    this.step -= 1;
                    this.animateFrames();
                    this.title = this.steps[this.step].title;
                    this.instruction = this.steps[this.step].instruction;
                    this.buttonText = this.steps[this.step].button;
                    this.percentDone = (this.step / (this.steps.length - 1)) * 100;
                }
            });
        }
		*/
    },
    mounted(): void {
        if (false) {
            // https://docs.nativescript.org/ui/action-bar
            console.log(
                "platform-header:mounted",
                "ios",
                this.ios,
                "settings",
                this.canNavigateSettings,
                "back",
                this.canNavigateBack,
                "classes",
                this.classes
            );
            // https://docs.nativescript.org/api-reference/classes/_ui_frame_.frame.html
            const frame = Frame.topmost();
            if (frame) {
                console.log("platform-header:backStack", frame.id, frame.backStack.length);
            }
        }
    },
    methods: {
        raiseBack(ev): void {
            this.$emit("back");
            if (this.onBack) {
                console.log("platform-header:back (fn)", this.onBack);
                this.onBack(ev);
            } else {
                console.log("platform-header:back (nav)");
                this.$navigateBack();
            }
        },
        raiseCancel(ev): void {
            this.$emit("cancel");
            if (this.onCancel) {
                console.log("platform-header:cancel (fn)");
                this.onCancel(ev);
            } else {
                console.log("platform-header:cancel (nav)");
                this.$navigateBack();
            }
        },
        raiseIcon(): void {
            console.log("platform-header:icon-tapped");
            this.$emit("icon-tapped");
        },
        raiseSave(): void {
            console.log("platform-header:save-tapped");
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

.action-bar {
    margin-left: -20;
}

.back-icon,
.normal-icon,
.configure-icon,
.close-icon {
    /* background-color: orange; */
    padding-bottom: 10;
    border-radius: 20;
}
.close-icon {
    padding-top: 8;
}
.back-icon {
    padding-top: 10;
}
.normal-icon {
    padding-top: 10;
}
.configure-icon {
    padding-top: 8;
}
</style>
