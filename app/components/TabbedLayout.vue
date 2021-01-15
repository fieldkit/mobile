<template>
    <Page actionBarHidden="true">
        <BottomNavigation id="bottom-nav" @selectedIndexChanged="onSelectedIndexChanged">
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
import { BottomNavigation } from "@nativescript/core";
import StationListView from "../components/StationListView.vue";
import DataSync from "../components/DataSyncView.vue";
import AppSettingsView from "../components/AppSettingsView.vue";
import { Frame } from "@nativescript/core";

export default Vue.extend({
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
    methods: {
        onSelectedIndexChanged(args) {
            // eslint-disable-next-line
            const view = <BottomNavigation>args.object;
            this.tab = view.selectedIndex;
            console.log("tab-changed", this.tab);
        },
        tapStations() {
            console.log("tab: stations");
            const frame: Frame = Frame.getFrameById("stations-frame");
            console.log(this.$s.state.nav.route);
            return this.$navigateTo(StationListView, {
                frame: frame.id,
                clearHistory: true,
                transition: { name: "fade" },
            });
        },
        tapData() {
            console.log("tab: data");
            const frame = Frame.getFrameById("data-frame");
            console.log(this.$s.state.nav.route);
            return this.$navigateTo(DataSync, {
                frame: frame.id,
                clearHistory: true,
                transition: { name: "fade" },
            });
        },
        tapSettings() {
            console.log("tab: settings");
            const frame = Frame.getFrameById("settings-frame");
            console.log(this.$s.state.nav.route);
            return this.$navigateTo(AppSettingsView, {
                frame: frame.id,
                clearHistory: true,
                transition: { name: "fade" },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
