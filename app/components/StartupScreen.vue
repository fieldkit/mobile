<template>
    <BottomNavigation id="bottom-nav" @selectedIndexChanged="onSelectedIndexChanged">
        <TabStrip backgroundColor="white">
            <TabStripItem @tap="tapStations">
                <Image width="22" height="22" src="~/images/Icon_Station_inactive2.png"></Image>
                <Label text="Stations"></Label>
            </TabStripItem>
            <TabStripItem @tap="tapData">
                <Image width="22" height="22" src="~/images/Icon_DataSync_inactive2.png"></Image>
                <Label text="Data"></Label>
            </TabStripItem>
            <TabStripItem @tap="tapSettings">
                <Image width="22" height="22" src="~/images/Icon_Settings_inactive2.png"></Image>
                <Label text="Settings"></Label>
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
</template>
<script lang="ts">
import { Vue } from "vue-property-decorator";
// import { Route } from "@/routes/navigate";
import { Services } from "@/services";
import { initializeApplication } from "@/startup";
import ServicesSingleton from "@/services/singleton";
// import AppSettings from "@/wrappers/app-settings";
import Config from "@/config";
import routes from "@/routes";

import StationListView from "../components/StationListView.vue";
import DataSync from "../components/DataSyncView.vue";
import AppSettingsView from "../components/AppSettingsView.vue";

/*
function getFirstRoute(services: Services): Route {
    const appSettings = new AppSettings();

    if (services.PortalInterface().isLoggedIn()) {
        return appSettings.getString("completedSetup") || appSettings.getNumber("skipCount") > 2
            ? routes.stations
            : routes.onboarding.assembleStation;
    }

    return routes.login;
}
*/

export default Vue.extend({
    components: {
        StationListView,
        DataSync,
        AppSettingsView,
    },
    async mounted(): Promise<void> {
        const services: Services = ServicesSingleton;

        console.log("startup loaded");

        if (true) {
            await initializeApplication(services);
        }

        console.log("developer", Config.env.developer);

        if (Config.env.developer) {
            /*
            return this.$navigateTo(routes.login, {
                clearHistory: true,
                props: {},
            });
			return this.$navigateTo(routes.internal.calibrate, {
				clearHistory: true,
				props: {
					stationId: 2,
					position: 0,
				},
			});
			return this.$navigateTo(routes.onboarding.assembleStation, {
				clearHistory: true,
				props: {},
			});
			return this.$navigateTo(routes.reader.flow, {
				clearHistory: true,
				props: {
					flowName: "onboarding",
				},
			});
            return this.$navigateTo(routes.stations, {
                clearHistory: true,
                props: {},
            });
            return this.$navigateTo(routes.appSettings.list, {
                clearHistory: true,
                props: {},
            });
            if (services.Store().getters.stationCalibrations[1]) {
                // return this.$navigateTo(routes.calibration.start, {
                // return this.$navigateTo(routes.deploy.start, {
                // return this.$navigateTo(routes.deploy.notes, {
                // return this.$navigateTo(routes.deploy.review, {
                return this.$navigateTo(routes.stationSettings, {
                    // return this.$navigateTo(routes.station.settings.firmware, {
                    // return this.$navigateTo(routes.station.settings.wifiNetworks, {
                    // return this.$navigateTo(routes.stationDetail, {
                    // return this.$navigateTo(routes.onboarding.start, {
                    clearHistory: true,
                    backstackVisible: true,
                    props: {
                        stationId: 1,
                        position: 3,
                    },
                });
            } else {
                console.log("no test station");
            }
			return this.$navigateTo(routes.onboarding.start, {
				clearHistory: true,
				props: {},
			});
            return this.$navigateTo(routes.dataSync, {
                clearHistory: true,
                props: {},
            });
            return this.$navigateTo(routes.developerMenu, {
                clearHistory: true,
                props: {},
            });
			*/
        }

        /*
        console.log("first navigate");

        await this.$navigateTo(getFirstRoute(services), {
            clearHistory: true,
        });
		*/
    },
    methods: {
        onSelectedIndexChanged() {
            console.log("tab-changed");
        },
        tapStations() {
            console.log("tab: stations");
            return this.$navigateTo(routes.stations, {
                frame: "stations-frame",
                clearHistory: true,
            });
        },
        tapData() {
            console.log("tab: data");
            return this.$navigateTo(routes.dataSync, {
                frame: "data-frame",
                clearHistory: true,
            });
        },
        tapSettings() {
            console.log("tab: settings");
            return this.$navigateTo(routes.appSettings.list, {
                frame: "settings-frame",
                clearHistory: true,
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
