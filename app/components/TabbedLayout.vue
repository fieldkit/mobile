<template>
    <Page actionBarHidden="true">
        <BottomNavigation id="bottom-nav" ref="bottomNavigation" @selectedIndexChanged="onSelectedIndexChanged">
            <TabStrip backgroundColor="white">
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
import routes, { KnownRoute } from "@/routes";
import StationListView from "../components/StationListView.vue";
import DataSync from "../components/DataSyncView.vue";
import AppSettingsView from "../components/app-settings/AppSettingsView.vue";

interface FirstTab {
    index: number;
    route: KnownRoute | null;
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
    } {
        return {
            tab: 0,
        };
    },
    created(): void {
        console.log(`tabbed: created`, this.firstTab, this.tab);
        this.$s.commit(new NavigationMutation("stations-frame", "StationListView", ""));
        this.$s.commit(new NavigationMutation("data-frame", "DataSync", ""));
        this.$s.commit(new NavigationMutation("settings-frame", "AppSettingsView", ""));
    },
    mounted(): void {
        console.log(`tabbed: mounted`, this.firstTab, this.tab);
        // eslint-disable-next-line
        this.updateSelected();
    },
    updated(): void {
        console.log(`tabbed: updated`, this.firstTab, this.tab);
        // eslint-disable-next-line
        this.updateSelected();
    },
    methods: {
        tabIndexToFrame(index: number): string {
            const frames = ["stations-frame", "data-frame", "settings-frame"];
            if (index < 0 || index >= frames.length) throw new Error(`invalid frame index`);
            return frames[index];
        },
        updateSelected(): void {
            console.log(`update-selected: updating`);

            // eslint-disable-next-line
            const firstTab: FirstTab = this.firstTab;

            if (firstTab) {
                const bottom = this.$refs.bottomNavigation;
                if (bottom) {
                    // eslint-disable-next-line
                    const view: any = <BottomNavigation>(bottom as any).nativeView;
                    // eslint-disable-next-line
                    console.log(`update-selected: changing tab`, view.selectedIndex, firstTab.index);
                    // eslint-disable-next-line
                    if (view.selectedIndex == firstTab.index) {
                        // eslint-disable-next-line
                        view.selectedIndex = firstTab.index;
                    } else {
                        console.log(`update-selected: same tab`);
                    }
                } else {
                    console.log(`update-selected: no bottom nav`);
                }

                if (firstTab.route && firstTab.index == 2) {
                    // eslint-disable-next-line
                    const frame: string = this.tabIndexToFrame(firstTab.index);
                    console.log(`update-selected: ${frame} / ${firstTab.route}`);
                    void this.$navigateTo(routes.appSettings[firstTab.route], {
                        frame: frame,
                        animated: false,
                        transition: {
                            duration: 0,
                        },
                    });
                } else {
                    console.log(`update-selected: no tab`);

                    void this.$navigateTo(StationListView, {
                        frame: "stations-frame",
                        animated: false,
                        transition: {
                            duration: 0,
                        },
                    });
                }
            } else {
                console.log(`update-selected: no first tab`);
            }
        },
        // eslint-disable-next-line
        onSelectedIndexChanged(args: any): void {
            // eslint-disable-next-line
            const view = <BottomNavigation>args.object;
            this.tab = view.selectedIndex;
            console.log("tab-changed", this.tab);
        },
        // eslint-disable-next-line
        isSameView(frameId: string, page: any): boolean {
            const frameStateNow = this.$s.state.nav.frames[frameId] || { name: null };
            // eslint-disable-next-line
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
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
