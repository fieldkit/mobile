<template>
    <Page actionBarHidden="true">
        <BottomNavigation
            id="bottom-nav"
            ref="bottomNavigation"
            :selectedIndex="tab"
            @selectedIndexChanged="onSelectedIndexChanged"
            @loaded="bottomLoaded"
        >
            <TabStrip backgroundColor="white" selectedItemColor="#2c3e50" unSelectedItemColor="#9a9fa6">
                <TabStripItem @tap="tapStations">
                    <Image
                        width="22"
                        height="22"
                        :src="tab == 0 ? '~/images/Icon_Station_active2.png' : '~/images/Icon_Station_inactive2.png'"
                    />
                    <Label text="Stations" />
                </TabStripItem>
                <TabStripItem @tap="tapData">
                    <Image
                        width="22"
                        height="22"
                        :src="tab == 1 ? '~/images/Icon_DataSync_active2.png' : '~/images/Icon_DataSync_inactive2.png'"
                    />
                    <Label text="Data" />
                </TabStripItem>
                <TabStripItem @tap="tapSettings">
                    <Image
                        width="22"
                        height="22"
                        :src="tab == 2 ? '~/images/Icon_Settings_active2.png' : '~/images/Icon_Settings_inactive2.png'"
                    />
                    <Label text="Settings" />
                </TabStripItem>
            </TabStrip>
            <TabContentItem>
                <Frame id="stations-frame">
                    <StationListView />
                </Frame>
            </TabContentItem>
            <TabContentItem>
                <Frame id="data-frame">
                    <DataSync />
                </Frame>
            </TabContentItem>
            <TabContentItem>
                <Frame id="settings-frame">
                    <AppSettingsView />
                </Frame>
            </TabContentItem>
        </BottomNavigation>
    </Page>
</template>
<script lang="ts">
import Vue, { PropType } from "vue";
import { Frame } from "@nativescript/core";
import { BottomNavigation } from "@nativescript/core";
import { NavigationMutation } from "@/store";
import { routes, Route, FullRoute } from "@/routes";
import StationListView from "../components/StationListView.vue";
import DataSync from "../components/DataSyncView.vue";
import AppSettingsView from "../components/app-settings/AppSettingsView.vue";

interface FirstTab {
    index: number;
    route: FullRoute | null;
}

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
        ready: boolean;
    } {
        return {
            tab: 0,
            ready: false,
        };
    },
    created(): void {
        console.log(`tabbed: created ${JSON.stringify(this.firstTab)}`, this.tab);
        this.$s.commit(new NavigationMutation("stations-frame", "StationListView", "", false));
        this.$s.commit(new NavigationMutation("data-frame", "DataSync", "", false));
        this.$s.commit(new NavigationMutation("settings-frame", "AppSettingsView", "", false));
    },
    mounted(): void {
        console.log(`tabbed: mounted ${JSON.stringify(this.firstTab)}`, this.tab);
    },
    updated(): void {
        console.log(`tabbed: updated ${JSON.stringify(this.firstTab)}`, this.tab);
    },
    methods: {
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
            this.tab = view.selectedIndex;
            console.log("tab-changed", this.tab);
        },
        async updateSelected(): Promise<void> {
            /* eslint-disable */
            console.log(`update-selected: updating`);

            const firstTab: FirstTab = this.firstTab;

            if (firstTab) {
                this.tab = this.firstTab.index;

                if (!firstTab.route) {
                    console.log(`update-selected: no tab`);
                    await this.$navigateTo(StationListView, {
                        clearHistory: true,
                        frame: "stations-frame",
                        animated: false,
                        transition: {
                            name: "fade",
                            duration: 300,
                        },
                    });
                } else {
                    await this.$navigateTo(firstTab.route, {});
                }
            } else {
                console.log(`update-selected: no first tab`);
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
            console.log(`tab: stations nav frame: ${frame.id} ${JSON.stringify(this.$s.state.nav.frames[frame.id])}`);
            if (this.tab == 0) {
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
            console.log(`tab: data nav frame: ${frame.id} ${JSON.stringify(this.$s.state.nav.frames[frame.id])}`);
            if (this.tab == 1) {
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
            console.log(`tab: settings nav frame: ${frame.id} ${JSON.stringify(this.$s.state.nav.frames[frame.id])}`);
            if (this.tab == 2) {
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
                console.log("tabbed: bottom-loaded (skip)");
            } else {
                console.log("tabbed: bottom-loaded");
                // eslint-disable-next-line
                this.updateSelected();
                this.ready = true;
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
