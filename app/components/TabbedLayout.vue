<template>
    <Page actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*">
            <MDBottomNavigation
                v-if="loaded"
                id="bottom-nav"
                ref="bottomNavigation"
                :selectedIndex="tab"
                @selectedIndexChanged="onSelectedIndexChanged"
                @loaded="bottomLoaded"
            >
                <MDTabStrip backgroundColor="white" selectedItemColor="#2c3e50" unSelectedItemColor="#9a9fa6">
                    <MDTabStripItem @tap="tapStations">
                        <Image
                            width="22"
                            height="22"
                            :src="tab == 0 ? '~/images/Icon_Station_active2.png' : '~/images/Icon_Station_inactive2.png'"
                        />
                        <Label text="Stations" />
                    </MDTabStripItem>
                    <MDTabStripItem @tap="tapData">
                        <Image
                            width="22"
                            height="22"
                            :src="tab == 1 ? '~/images/Icon_DataSync_active2.png' : '~/images/Icon_DataSync_inactive2.png'"
                        />
                        <Label text="Data" />
                    </MDTabStripItem>
                    <MDTabStripItem @tap="tapSettings">
                        <Image
                            width="22"
                            height="22"
                            :src="tab == 2 ? '~/images/Icon_Settings_active2.png' : '~/images/Icon_Settings_inactive2.png'"
                        />
                        <Label text="Settings" />
                    </MDTabStripItem>
                </MDTabStrip>
                <MDTabContentItem>
                    <Frame id="stations-frame">
                        <component :is="stationsView()" v-bind="childProps()" />
                    </Frame>
                </MDTabContentItem>
                <MDTabContentItem>
                    <Frame id="data-frame">
                        <DataSync />
                    </Frame>
                </MDTabContentItem>
                <MDTabContentItem>
                    <Frame id="settings-frame">
                        <AppSettingsView />
                    </Frame>
                </MDTabContentItem>
            </MDBottomNavigation>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue, { PropType } from "vue";
import { Frame } from "@nativescript/core";
import { BottomNavigation } from "@nativescript-community/ui-material-bottom-navigation";
import { getRouteComponent, FirstTab } from "@/routes";
import { getBus } from "@/components/NavigationBus";
import StationListView from "@/components/StationListView.vue";
import DataSync from "@/components/DataSyncView.vue";
import AppSettingsView from "@/components/app-settings/AppSettingsView.vue";
import FlowView from "@/reader/FlowView.vue";
import { promiseAfter, logAnalytics } from "@/lib";
import { registerSoftKeyboardCallback } from "nativescript-soft-keyboard";

export default Vue.extend({
    name: "TabbedLayout",
    components: {
        StationListView,
        DataSync,
        AppSettingsView,
    },
    props: {
        firstTab: {
            type: Object as PropType<FirstTab>,
            required: false,
            default: () => {
                return { index: 0, route: null };
            },
        },
    },
    data(): {
        tab: number;
        keyboard: boolean;
        loaded: boolean;
        ready: boolean;
        showings: { [index: number]: number };
    } {
        return {
            tab: 0,
            keyboard: false,
            loaded: false,
            ready: false,
            showings: {},
        };
    },
    created(): void {
        registerSoftKeyboardCallback((h) => {
            console.log(`keyboard change: ${h}`);
            this.keyboard = h > 0;
        });

        console.log(`tabbed-layout: created ${JSON.stringify(this.firstTab)}`, this.tab, this.ready);

        getBus().$on("nav:tab", this.onTabChangedRequired);
    },
    mounted(): void {
        console.log(`tabbed-layout: mounted ${JSON.stringify(this.firstTab)}`, this.tab, this.ready);
    },
    updated(): void {
        console.log(`tabbed-layout: updated ${JSON.stringify(this.firstTab)}`, this.tab, this.ready);
    },
    methods: {
        onTabChangedRequired(tab: number) {
            console.log("nav:tab", tab);
            if (this.tab != tab) {
                this.tab = tab;
            }
        },
        async onPageLoaded(): Promise<void> {
            console.log(`tabbed-layout: page-loaded`);

            await logAnalytics("tabbed_loaded");

            // HACK For some reason BottomNavigation is just blank at
            // startup, like the render is happening before things are setup
            // and then aren't checked again.
            void promiseAfter(100).then(() => {
                this.loaded = true;
            });
        },
        // eslint-disable-next-line
        onSelectedIndexChanged(args: any): void {
            /* eslint-disable */
            const view = <BottomNavigation>args.object;
            if (this.tab != view.selectedIndex) {
                this.tab = view.selectedIndex;
                console.log(`tabbed-layout: tab-changed:`, this.tab, this.ready);
            }
        },
        isSameView(frameId: string, page: any): boolean {
            /* eslint-disable */
            const frameStateNow = this.$s.state.nav.frames[frameId] || { name: null };
            const desiredPage: string | null = page.options?.name || null;
            if (!desiredPage) {
                return false;
            }
            return desiredPage == frameStateNow.name;
        },
        stationsView(): unknown {
            console.log(`getting-stations-view`);

            const firstTab: FirstTab = this.firstTab;
            if (firstTab) {
                if (firstTab.flow) {
                    console.log(`getting-stations-view: flow`);
                    console.log(`getting-stations-view: props`, this.childProps());
                    return FlowView;
                }

                if (firstTab.route) {
                    console.log(`getting-stations-view: first-tab-route`);
                    return getRouteComponent(firstTab.route);
                }
            }

            console.log(`getting-stations-view: stations`);
            return StationListView;
        },
        childProps(): Record<string, unknown> {
            const firstTab: FirstTab = this.firstTab;
            if (firstTab && firstTab.route) {
                return firstTab.route.props;
            }
            if (firstTab && firstTab.flow) {
                return firstTab.flow;
            }
            return {};
        },
        async tapStations(): Promise<void> {
            const frame: Frame = Frame.getFrameById("stations-frame");
            console.log(`tabbed-layout: stations nav frame: ${frame.id} ${JSON.stringify(this.$s.state.nav.frames[frame.id])}`);
            if (this.tab == 0) {
                await logAnalytics("tabbed_tap_stations");

                // eslint-disable-next-line
                if (!this.isSameView(frame.id, StationListView)) {
                    await this.$navigateTo(StationListView, {
                        frame: frame.id,
                        clearHistory: true,
                        transition: { name: "fade" },
                    });
                }
            }
        },
        async tapData(): Promise<void> {
            const frame = Frame.getFrameById("data-frame");
            console.log(`tabbed-layout: data nav frame: ${frame.id} ${JSON.stringify(this.$s.state.nav.frames[frame.id])}`);
            if (this.tab == 1) {
                await logAnalytics("tabbed_tap_data");

                // eslint-disable-next-line
                if (!this.isSameView(frame.id, DataSync)) {
                    await this.$navigateTo(DataSync, {
                        frame: frame.id,
                        clearHistory: true,
                        transition: { name: "fade" },
                    });
                }
            }
        },
        async tapSettings(): Promise<void> {
            const frame = Frame.getFrameById("settings-frame");
            console.log(`tabbed-layout: settings nav frame: ${frame.id} ${JSON.stringify(this.$s.state.nav.frames[frame.id])}`);
            if (this.tab == 2) {
                await logAnalytics("tabbed_tap_settings");

                // eslint-disable-next-line
                if (!this.isSameView(frame.id, AppSettingsView)) {
                    await this.$navigateTo(AppSettingsView, {
                        frame: frame.id,
                        clearHistory: true,
                        transition: { name: "fade" },
                    });
                }
            }
        },
        bottomLoaded(): void {
            getBus().$emit("nav:tabs-ready");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
