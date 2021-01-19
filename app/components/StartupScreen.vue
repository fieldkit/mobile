<template>
    <Page actionBarHidden="true"></Page>
</template>
<script lang="ts">
import { Vue } from "vue-property-decorator";
import { Route } from "@/routes/navigate";
import { Services } from "@/services";
import { initializeApplication } from "@/startup";
import ServicesSingleton from "@/services/singleton";
import AppSettings from "@/wrappers/app-settings";
import Config from "@/config";
import routes from "@/routes";

function getFirstRoute(services: Services): Route {
    const appSettings = new AppSettings();

    if (services.PortalInterface().isLoggedIn()) {
        return appSettings.getString("completedSetup") || appSettings.getNumber("skipCount") > 2
            ? routes.tabbed
            : routes.onboarding.assembleStation;
    }

    return routes.login;
}

export default Vue.extend({
    components: {},
    async mounted(): Promise<void> {
        const services: Services = ServicesSingleton;

        console.log("startup loaded");

        await initializeApplication(services);

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
            await this.$navigateTo(routes.tabbed, {
                clearHistory: true,
                props: {},
            });
            await this.$navigateTo(routes.reader.flow, {
                clearHistory: true,
                props: {
                    flowName: "onboarding",
                },
            });
			*/
            await this.$navigateTo(routes.appSettings.list, {
                clearHistory: true,
                props: {},
            });
            return;
        }

        console.log("first navigate");

        try {
            await this.$navigateTo(getFirstRoute(services), {
                frame: "outer-frame",
                clearHistory: true,
            });
        } catch (err) {
            console.log("error", err, err.stack);
        }
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
