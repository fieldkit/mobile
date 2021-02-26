<template>
    <Page actionBarHidden="true"></Page>
</template>
<script lang="ts">
import { Vue } from "vue-property-decorator";
import { Route, FullRoute } from "@/routes/navigate";
import { Services } from "@/services";
import { initializeApplication } from "@/startup";
import ServicesSingleton from "@/services/singleton";
import AppSettings from "@/wrappers/app-settings";
import Config from "@/config";
import routes from "@/routes";
import { zoned } from "@/lib";

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

        await zoned({}, async () => {
            await initializeApplication(services);
        });

        if (Config.env.developer) {
            console.log("developer", Config.env.developer);

            await this.$navigateTo(routes.tabbed, {
                clearHistory: true,
                props: {
                    firstTab: {
                        index: 0,
                        route: new FullRoute("station/settings/menu", "stations-frame", {
                            stationId: 1,
                        }),
                    },
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
