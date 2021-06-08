<template>
    <Page @navigatingTo="onNavigatingTo" @navigatingFrom="onNavigatingFrom" class="flow-reader">
        <PlatformHeader :title="title" :onBack="onBackward" :canNavigateSettings="false" :border="false" />
        <StackLayout v-if="ready" v-bind:key="flow.index">
            <GridLayout rows="auto,*">
                <FlowProgress row="0" :progress="progress" />

                <SkipLayout
                    :buttonLabel="screen.forward"
                    :buttonEnabled="screen.navOptions.forward.allowed"
                    :skipLabel="screen.skip"
                    :helpLabel="helpLabel"
                    @button="onForward"
                    @help="onGuide(screen.guide.url)"
                    @skip="onSkip"
                    row="1"
                >
                    <template v-if="screen.simple.length >= 1">
                        <ByOrientation row="1">
                            <template v-slot:landscape>
                                <ScrollView class="simple-screen-container">
                                    <SimpleScreen
                                        :screen="screen.simple[0]"
                                        :frame="frame"
                                        v-bind:key="nav.key"
                                        class="simple-screen scrolling"
                                    />
                                </ScrollView>
                            </template>
                            <template v-slot:portrait>
                                <SimpleScreen :screen="screen.simple[0]" :frame="frame" v-bind:key="nav.key" class="simple-screen" />
                            </template>
                        </ByOrientation>
                    </template>
                </SkipLayout>
            </GridLayout>
        </StackLayout>
        <StackLayout v-else class="loading"></StackLayout>
    </Page>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import FlowProgress from "./FlowProgress.vue";
import SimpleScreen from "./SimpleScreen.vue";
import ByOrientation from "./ByOrientation.vue";
import SkipLayout from "@/components/SkipLayout.vue";
import PlatformHeader from "@/components/PlatformHeader.vue";
import { FullRoute } from "@/routes";
import { debug, _L, Timer, logAnalytics } from "@/lib";
import { FlowNavigator, NavigationOption, VisibleScreen, NavigationProps } from "./model";
import { ModuleHeader, tryFindModuleHeader } from "./headers";
import { getFlows } from "./download";
import * as utils from "@nativescript/core/utils/utils";
import { Screen } from "@nativescript/core";

function isLandscape(): boolean {
    return Screen.mainScreen.widthDIPs > Screen.mainScreen.heightDIPs;
}

const FlowView = Vue.extend({
    name: "FlowView",
    components: {
        PlatformHeader,
        FlowProgress,
        SkipLayout,
        ByOrientation,
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
        landscape(): boolean {
            return isLandscape();
        },
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
            return _L("titles.loading");
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
        helpLabel(): string | null {
            if (this.screen.guide) {
                return this.screen.guide.title;
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
        debug.log(`flow: mounted`, `flow`, this.flow);

        await logAnalytics("flow_open", { name: this.flow.name });
    },
    methods: {
        async onForward(): Promise<void> {
            debug.log("flow-view: forward", this.screen.name, this.screen.navOptions.forward);
            await logAnalytics("flow_forward", { name: this.flow.name });
            await this.nav.move(this.screen.navOptions.forward).then(async (maybeProps) => {
                if (maybeProps) {
                    debug.log("flow-view: forward:props", maybeProps);
                    await this.$deprecatedNavigateTo(FlowView, {
                        frame: "stations-frame", // TODO Can we infer this?
                        props: {
                            flow: maybeProps,
                            finished: this.finished,
                            skipped: this.skipped,
                        },
                    });
                } else {
                    debug.log("flow-view: done");
                    await this.leave(this.finished);
                }
                return;
            });
        },
        async onBackward(): Promise<void> {
            await this.$navigateBack();
        },
        onNavigatingTo(): void {
            debug.log("flow: arriving");
            if (!this.timer) {
                this.timer = new Timer(2000, (frame) => {
                    debug.log("frame", frame);
                    this.frame = frame;
                });
            }
        },
        onNavigatingFrom(): void {
            debug.log("flow: leaving");
            if (this.timer) {
                this.timer.stop();
                this.timer = null;
            }
        },
        async onSkip(): Promise<void> {
            debug.log("flow-view: skip", this.screen.name);
            await logAnalytics("flow_skip", { name: this.flow.name });
            await this.nav.move(NavigationOption.Skip);
            await this.leave(this.skipped);
        },
        async onGuide(url: string): Promise<void> {
            utils.openUrl(url);
            await Promise.resolve();
        },
        async onCancel(): Promise<void> {
            debug.log("flow-view: cancel", this.screen.name);
            await this.leave(this.skipped);
        },
        async leave(route: FullRoute): Promise<void> {
            await this.$deprecatedNavigateTo(route);
        },
    },
});

export default FlowView;
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.flow-reader {
    .center-container {
        padding: 0;
        margin: 0;
    }

    .container {
        padding: 0;
        margin: 0;
    }

    .loading {
        padding: 20;
    }

    .simple-screen {
        padding: 10;
    }

    .simple-screen.scrolling Image {
        width: 50%;
    }
}

.ns-android .flow-reader .simple-screen {
    margin-top: 10;
}
</style>
