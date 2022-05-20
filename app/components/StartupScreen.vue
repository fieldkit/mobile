<template>
    <Page actionBarHidden="true"></Page>
</template>
<script lang="ts">
import { Vue } from "vue-property-decorator";
import { fullRoutes, FullRoute, getFullRouteComponent } from "@/routes";
import { Services } from "@/services";
import { initializeApplication } from "@/startup";
import ServicesSingleton from "@/services/singleton";
import AppSettings from "@/wrappers/app-settings";
import { debug, zoned } from "@/lib";
import { changeLanguageI18n } from "~/lib/i18n";

function getFirstRoute(services: Services): FullRoute {
    const appSettings = new AppSettings();

    if (services.PortalInterface().isLoggedIn()) {
        if (!services.PortalInterface().isTncValid()) {
            return fullRoutes.tnc;
        }
        const tabbed = fullRoutes.stations;
        const onboarding = fullRoutes.onboarding.assemble;
        const completedSetup = appSettings.getString("completedSetup");
        const skipCount = appSettings.getNumber("skipCount");
        debug.log(`${JSON.stringify({ completedSetup, skipCount })}`);
        return completedSetup || skipCount > 2 ? tabbed : onboarding;
    }

    return fullRoutes.login;
}

export default Vue.extend({
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
        },
    },
    components: {},
    async mounted(): Promise<void> {
        const services: Services = ServicesSingleton;

        debug.log("startup loaded");

        await zoned({}, async () => {
            await initializeApplication(services);
        });

        changeLanguageI18n(this.currentSettings.appearance.language);

        try {
            const firstRoute = getFirstRoute(services);
            const component = getFullRouteComponent(firstRoute);
            await this.$navigateTo(component, {
                props: firstRoute.props,
                clearHistory: true,
            });
        } catch (err) {
            debug.log("error", err, err.stack);
        }
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
