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
        const tabbed = fullRoutes.stations;
        const onboarding = fullRoutes.onboarding.assemble;
        const completedSetup = appSettings.getString("completedSetup");
        const skipCount = appSettings.getNumber("skipCount");
        console.log(`${JSON.stringify({ completedSetup, skipCount })}`);
        return completedSetup || skipCount > 2 ? tabbed : onboarding;
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

            if (false) {
                await this.$navigateTo(fullRoutes.stations, {
                    clearHistory: true,
                });

                return;
            }

            if (false) {
                await this.$navigateTo(fullRoutes.settings.developer, {
                    clearHistory: true,
                });

                return;
            }

            if (false) {
                if (this.$s.getters.stationCalibrations[1]) {
                    await this.$navigateTo(fullRoutes.onboarding.recalibrate(1), {
                        clearHistory: true,
                    });

                    return;
                }
            }

            if (true) {
                await this.$navigateTo(
                    fullRoutes.flow({
                        flow: {
                            name: "onboarding",
                        },
                        finished: new FullRoute("tabbed", "outer-frame", {}),
                        skipped: new FullRoute("tabbed", "outer-frame", {}),
                    })
                );

                return;
            }
        }

        try {
            await this.$navigateTo(getFirstRoute(services), {
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
