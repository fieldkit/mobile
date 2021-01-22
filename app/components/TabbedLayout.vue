<template>
    <Page actionBarHidden="true">
        <BottomNavigation id="bottom-nav" @selectedIndexChanged="onSelectedIndexChanged" ref="bottomNavigation">
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
import { Vue } from "vue-property-decorator";
import { Frame } from "@nativescript/core";
import { BottomNavigation } from "@nativescript/core";
import StationListView from "../components/StationListView.vue";
import DataSync from "../components/DataSyncView.vue";
import AppSettingsView from "../components/app-settings/AppSettingsView.vue";
import { getBus } from "@/components/NavigationBus";
import { NavigationMutation } from "@/store";
import routes from "@/routes";

export default Vue.extend({
    name: "TabbedLayout",
    components: {
        StationListView,
        DataSync,
        AppSettingsView,
    },
    data(): {
        tab: number;
    } {
        return {
            tab: 0,
        };
    },
    mounted() {
        this.$s.commit(new NavigationMutation("stations-frame", "StationListView", ""));
        this.$s.commit(new NavigationMutation("data-frame", "DataSync", ""));
        this.$s.commit(new NavigationMutation("settings-frame", "AppSettingsView", ""));

        getBus().$on("open-settings", (data) => {
            console.log("open-settings", data);
            void this.$navigateTo(routes.appSettings[data], {
                frame: "settings-frame",
                animated: false,
                transition: {
                    duration: 0,
                },
            }).then(() => {
                const view: any = <BottomNavigation>(this.$refs.bottomNavigation as any).nativeView;
                view.selectedIndex = 2;
            });
        });
    },
    methods: {
        onSelectedIndexChanged(args) {
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
        async tapStations() {
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
        async tapData() {
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
        async tapSettings() {
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
