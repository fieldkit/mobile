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

        if (Config.env.developer) {
            console.log("developer", Config.env.developer);

            // const route = routes.calibration.start;
            // const route = routes.deploy.start;
            // const route = routes.deploy.notes;
            // const route = routes.deploy.review;
            // const route = routes.stationSettings;
            // const route = routes.station.settings.firmware;
            // const route = routes.station.settings.wifiNetworks;
            // const route = routes.stationDetail;
            // const route = routes.onboarding.start;
            // const route = routes.internal.calibrate;
            // const route = routes.dataSync;
            // const route = routes.developerMenu;
            // const route = routes.reader.flow;
            // const route = routes.appSettings.account;
            // const route = routes.tabbed;
            // const route = routes.onboarding.assembleStation;
            // const route = routes.onboarding.network;
            const route = routes.onboarding.start;
            // const route = routes.tabbed;
            // const route = routes.login;
            if (route != routes.tabbed) {
                await this.$navigateTo(routes.tabbed, {
                    clearHistory: true,
                    props: {
                        stationId: 1,
                        position: 0,
                    },
                });
            }
            await this.$navigateTo(route, {
                clearHistory: true,
                frame: "stations-frame",
                props: {
                    stationId: 1,
                    position: 0,
                },
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
