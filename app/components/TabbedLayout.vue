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
                        <StationListView />
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
import { routes, Route, FirstTab } from "@/routes";
import { getBus } from "@/components/NavigationBus";
import StationListView from "@/components/StationListView.vue";
import DataSync from "@/components/DataSyncView.vue";
import AppSettingsView from "@/components/app-settings/AppSettingsView.vue";
import FlowView from "@/reader/FlowView.vue";
import { promiseAfter, logAnalytics } from "@/lib";

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
        loaded: boolean;
        ready: boolean;
    } {
        return {
            tab: 0,
            loaded: false,
            ready: false,
        };
    },
    created(): void {
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
        async onPageLoaded(): void {
            console.log(`tabbed-layout: page-loaded`);

            await logAnalytics("tabbed_loaded");

            // HACK For some reason BottomNavigation is just blank at
            // startup, like the render is happening before things are setup
            // and then aren't checked again.
            void promiseAfter(100).then(() => {
                this.loaded = true;
            });
        },
        tabIndexToFrame(index: number): string {
            const frames = ["stations-frame", "data-frame", "settings-frame"];
            if (index < 0 || index >= frames.length) throw new Error(`invalid frame index`);
            return frames[index];
        },
        tabIndexToRoute(index: number): Record<string, Route> {
            switch (index) {
                case 0:
                    return routes.station.settings;
                case 2:
                    return routes.appSettings;
            }
            return {};
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
        async updateSelected(): Promise<void> {
            /* eslint-disable */
            console.log(`tabbed-layout: update-selected:`, this.tab, this.ready);

            const firstTab: FirstTab = this.firstTab;

            if (firstTab) {
                if (this.tab != this.firstTab.index) {
                    this.tab = this.firstTab.index;
                }

                if (firstTab.flow) {
                    await this.$navigateTo(FlowView, {
                        clearHistory: true,
                        frame: "stations-frame",
                        props: firstTab.flow,
                        animated: false,
                    });
                } else if (firstTab.route) {
                    console.log(`tabbed-layout: update-selected: have ${JSON.stringify(firstTab.route)}`);
                    await this.$navigateTo(firstTab.route, {});
                } else {
                    console.log(`tabbed-layout: update-selected: default tab`);
                    await this.$navigateTo(StationListView, {
                        clearHistory: true,
                        frame: "stations-frame",
                        animated: false,
                    });
                }
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
            if (this.ready) {
                console.log("tabbed-layout: bottom-loaded (skip)", this.tab);
            } else {
                console.log("tabbed-layout: bottom-loaded", this.tab);
                this.$nextTick(() => {
                    // eslint-disable-next-line
                    this.updateSelected();
                    this.ready = true;
                });
            }
            getBus().$emit("nav:tabs-ready");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
