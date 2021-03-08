<template>
    <Page actionBarHidden="true"></Page>
</template>
<script lang="ts">
import { Vue } from "vue-property-decorator";
import { fullRoutes, FullRoute } from "@/routes";
import { Services } from "@/services";
import { initializeApplication } from "@/startup";
import ServicesSingleton from "@/services/singleton";
import AppSettings from "@/wrappers/app-settings";
import Config from "@/config";
import { zoned } from "@/lib";

function getFirstRoute(services: Services): FullRoute {
    const appSettings = new AppSettings();

    if (services.PortalInterface().isLoggedIn()) {
        const tabbed = fullRoutes.login;
        const onboarding = fullRoutes.onboarding.assemble;
        return appSettings.getString("completedSetup") || appSettings.getNumber("skipCount") > 2 ? tabbed : onboarding;
    }

    return fullRoutes.login;
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

            await this.$navigateTo(fullRoutes.onboarding.start);

            return;
        }

        console.log("first navigate");

        try {
            await this.$navigateTo(getFirstRoute(services));
        } catch (err) {
            console.log("error", err, err.stack);
        }
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
