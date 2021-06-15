<template>
    <ActionBar backgroundColor="white" flat="true" :class="classes">
        <template v-if="ios">
            <template v-if="canNavigateSettings">
                <NavigationButton v-show="false" />
                <ActionItem v-show="canNavigateBack" text="Back" ios.position="left" @tap="raiseBack" />
                <GridLayout :rows="subtitle ? 'auto,auto' : 'auto'" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
                <ActionItem ios.systemIcon="2" ios.position="right" android.systemIcon="ic_menu_edit" @tap="onSettings" />
            </template>
            <template v-else-if="canSave">
                <NavigationButton v-show="false" />
                <ActionItem v-show="canNavigateBack" text="Back" ios.position="left" @tap="raiseBack" />
                <GridLayout :rows="subtitle ? 'auto,auto' : 'auto'" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
                <ActionItem ios.systemIcon="3" ios.position="right" android.systemIcon="ic_menu_edit" @tap="raiseSave" />
            </template>
            <template v-else>
                <NavigationButton v-show="false" />
                <ActionItem v-show="canNavigateBack" text="Back" ios.position="left" @tap="raiseBack" />
                <GridLayout :rows="subtitle ? 'auto,auto' : 'auto'" columns="*">
                    <Label row="0" class="title m-t-10 m-b-5 text-center text" :text="title"></Label>
                    <Label row="1" class="text-center subtitle text" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
                </GridLayout>
            </template>
        </template>
        <template v-else>
            <GridLayout rows="auto" columns="15*,70*,15*" class="android" verticalAlignment="middle">
                <StackLayout v-if="canNavigateBack" col="0" class="back-icon" @tap="raiseBack">
                    <Image height="25" src="~/images/Icon_Backarrow.png"></Image>
                </StackLayout>
                <GridLayout v-if="subtitle" col="1" rows="auto,auto" columns="*" verticalAlignment="middle">
                    <Label row="0" class="text-center title" :text="title" textWrap="false" />
                    <Label row="1" class="text-center subtitle" :text="subtitle" textWrap="false" />
                </GridLayout>
                <GridLayout v-else col="1" rows="auto" columns="*" verticalAlignment="middle">
                    <Label row="0" class="text-center title" :text="title" textWrap="false" />
                </GridLayout>
                <StackLayout v-if="!icon && canCancel" col="2" class="close-icon" @tap="raiseCancel">
                    <Image height="25" src="~/images/Icon_Close.png"></Image>
                </StackLayout>
                <StackLayout v-if="!icon && canNavigateSettings" col="2" class="configure-icon" @tap="onSettings">
                    <Image height="25" src="~/images/Icon_Congfigure.png"></Image>
                </StackLayout>
                <StackLayout v-if="icon" col="2" class="normal-icon" @tap="raiseIcon">
                    <Image height="25" :src="icon"></Image>
                </StackLayout>
                <StackLayout v-else col="2"></StackLayout>
            </GridLayout>
        </template>
    </ActionBar>
</template>
<script lang="ts">
import Vue, { PropType } from "vue";
import { Frame, isIOS } from "@nativescript/core";
import { debug } from "@/lib/debugging";

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
        border: {
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
            c.push("action-bar");
            if (this.border) {
                c.push("action-bar-border");
            }
            if (this.subtitle) {
                c.push("action-bar-double");
            }
            return c.join(" ");
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
        /* eslint-disable */
        if (false) {
            // https://docs.nativescript.org/ui/action-bar
            debug.log(
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
        }
        if (false) {
            // https://docs.nativescript.org/api-reference/classes/_ui_frame_.frame.html
            const frame = Frame.topmost();
            if (frame) {
                debug.log("platform-header:backStack", frame.id, frame.backStack.length);
            }
        }
    },
    methods: {
        raiseBack(ev): void {
            this.$emit("back");
            if (this.onBack) {
                debug.log("platform-header:back (fn)", this.onBack);
                this.onBack(ev);
            } else {
                debug.log("platform-header:back (nav)");
                this.$navigateBack();
            }
        },
        raiseCancel(ev): void {
            this.$emit("cancel");
            if (this.onCancel) {
                debug.log("platform-header:cancel (fn)");
                this.onCancel(ev);
            } else {
                debug.log("platform-header:cancel (nav)");
                this.$navigateBack({});
            }
        },
        raiseIcon(): void {
            debug.log("platform-header:icon-tapped");
            this.$emit("icon-tapped");
        },
        raiseSave(): void {
            debug.log("platform-header:save-tapped");
            this.$emit("icon-tapped");
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.action-bar {
    margin-left: -20;

    StackLayout,
    GridLayout,
    Label {
        margin: 0;
        padding: 0;
    }

    .action-bar-border {
        border-bottom-color: $fk-gray-lighter;
        border-bottom-width: 1;
    }

    .title {
        // background-color: #accfaa;
    }

    .subtitle {
        // background-color: #fccfaa;
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
        // background-color: #efafaf;
    }
    .normal-icon {
        padding-top: 10;
    }
    .configure-icon {
        padding-top: 8;
        // background-color: #efafaf;
    }
}

.ns-ios .action-bar {
    margin-bottom: 20;
}

.ns-android .action-bar-double {
    padding-top: 10;
}
</style>
