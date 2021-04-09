<template>
    <Page @navigatingFrom="onNavigatingFrom" :actionBarHidden="title == null">
        <PlatformHeader :title="title" :onBack="onBackward" :canNavigateSettings="false" v-if="title" />
        <StackLayout v-if="ready" v-bind:key="flow.index">
            <GridLayout rows="auto,*,auto">
                <FlowProgress row="0" :progress="progress" />
                <ScrollView row="1">
                    <SimpleScreen
                        v-if="screen.simple.length >= 1"
                        :screen="screen.simple[0]"
                        :frame="frame"
                        class="simple-screen-container"
                        v-bind:key="nav.key"
                    />
                </ScrollView>
                <StackLayout row="2">
                    <Button
                        class="btn btn-primary btn-padded"
                        :text="screen.forward"
                        :isEnabled="screen.navOptions.forward.allowed"
                        @tap="onForward"
                    />
                    <Label v-if="screen.guide" :text="screen.guide.title" class="guide" textWrap="true" @tap="onGuide(screen.guide.url)" />
                    <Label v-if="screen.skip" :text="screen.skip" class="skip" textWrap="true" @tap="onSkip" />
                </StackLayout>
            </GridLayout>
        </StackLayout>
        <StackLayout v-else class="loading">
            <Label text="Loading" />
        </StackLayout>
    </Page>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import FlowProgress from "./FlowProgress.vue";
import SimpleScreen from "./SimpleScreen.vue";
import PlatformHeader from "@/components/PlatformHeader";
import { FullRoute } from "@/routes";
import { Timer } from "@/lib";
import { FlowNavigator, NavigationOption, VisibleScreen, NavigationProps } from "./model";
import { ModuleHeader, tryFindModuleHeader } from "./headers";
import { getFlows } from "./download";
import * as utils from "@nativescript/core/utils/utils";

const FlowView = Vue.extend({
    name: "FlowView",
    components: {
        PlatformHeader,
        FlowProgress,
        SimpleScreen,
    },
    props: {
        flow: {
            type: Object as PropType<NavigationProps>,
            required: true,
        },
        finished: {
            type: Object as PropType<FullRoute>,
            default: () => {
                return {
                    name: "developer",
                    frame: "outer-frame",
                    props: {},
                };
            },
        },
        skipped: {
            type: Object as PropType<FullRoute>,
            default: () => {
                return {
                    name: "developer",
                    frame: "outer-frame",
                    props: {},
                };
            },
        },
    },
    data(): {
        nav: FlowNavigator;
        timer: Timer | null;
        frame: number;
    } {
        return {
            nav: FlowNavigator.None,
            timer: null,
            frame: 0,
        };
    },
    computed: {
        ready(): boolean {
            return this.nav.ready;
        },
        screen(): VisibleScreen {
            return this.nav.screen;
        },
        progress(): number {
            return this.nav.progress;
        },
        title(): string | null {
            if (this.nav.ready) {
                if (this.screen && this.screen.header) {
                    return this.screen.header.title;
                }
            }
            return null;
        },
        header(): ModuleHeader | undefined {
            return tryFindModuleHeader(this.flow.name);
        },
        subtitle(): string | null {
            if (this.nav.ready) {
                if (this.header) {
                    return this.header.name;
                }
            }
            return null;
        },
        icon(): string | null {
            if (this.nav.ready) {
                if (this.header) {
                    return this.header.icon;
                }
            }
            return null;
        },
    },
    async mounted(): Promise<void> {
        const flows = await getFlows();
        this.nav = new FlowNavigator(flows, this.flow);
        try {
            console.log("flow: mounted", this.flow);
            console.log("flow: mounted", "module-header", this.header);
            if (this.screen) {
                console.log("flow: mounted", "screen-header", this.screen.header);
            }
        } catch (error) {
            console.log("error", error);
        }
        this.timer = new Timer(2000, (frame) => {
            this.frame = frame;
        });
    },
    methods: {
        async onForward(): Promise<void> {
            console.log("flow-view: forward", this.screen.name, this.screen.navOptions.forward);
            await this.nav.move(this.screen.navOptions.forward).then(async (maybeProps) => {
                if (maybeProps) {
                    console.log("flow-view: forward:props", maybeProps);
                    await this.$navigateTo(FlowView, {
                        frame: "stations-frame", // TODO Can we infer this?
                        props: {
                            flow: maybeProps,
                            finished: this.finished,
                            skipped: this.skipped,
                        },
                    });
                } else {
                    console.log("flow-view: done");
                    await this.leave(this.finished);
                }
                return;
            });
        },
        async onBackward(): Promise<void> {
            await this.$navigateBack();
        },
        onNavigatingFrom(): void {
            console.log("flow: leaving");
            if (this.timer) {
                this.timer.stop();
                this.timer = null;
            }
        },
        async onSkip(): Promise<void> {
            console.log("flow-view: skip", this.screen.name);
            await this.nav.move(NavigationOption.Skip);
            await this.leave(this.skipped);
        },
        async onGuide(url: string): Promise<void> {
            utils.openUrl(url);
            await Promise.resolve();
        },
        async onCancel(): Promise<void> {
            console.log("flow-view: cancel", this.screen.name);
            await this.leave(this.skipped);
        },
        async leave(route: FullRoute): Promise<void> {
            await this.$navigateTo(route);
        },
    },
});

export default FlowView;
</script>

<style scoped lang="scss">
@import "~/_app-variables";
.skip {
    width: 115;
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

.center-container {
    padding: 0;
    margin: 0;
}

.container {
    padding: 0;
    margin: 0;
}

.simple-screen-container {
}

.loading {
    padding: 20;
}
</style>
