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
import { debug, zoned } from "@/lib";

function getFirstRoute(services: Services): FullRoute {
    const appSettings = new AppSettings();

    if (services.PortalInterface().isLoggedIn()) {
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
    components: {},
    async mounted(): Promise<void> {
        const services: Services = ServicesSingleton;

        debug.log("startup loaded", 2);

        await zoned({}, async () => {
            await initializeApplication(services);
        });

        if (Config.env.developer) {
            debug.log("developer", Config.env.developer);

            if (false) {
                await this.$deprecatedNavigateTo(fullRoutes.login);

                return;
            }

            if (false) {
                await this.$deprecatedNavigateTo(fullRoutes.onboarding.start);

                return;
            }

            if (false) {
                await this.$deprecatedNavigateTo(fullRoutes.station.details(1));

                return;
            }

            if (false) {
                await this.$deprecatedNavigateTo(fullRoutes.onboarding.addModule(1));

                return;
            }

            if (false) {
                await this.$deprecatedNavigateTo(fullRoutes.stations, {
                    clearHistory: true,
                });

                return;
            }

            if (false) {
                await this.$deprecatedNavigateTo(fullRoutes.settings.developer, {
                    clearHistory: true,
                });

                return;
            }

            if (false) {
                if (this.$s.getters.stationCalibrations[1]) {
                    await this.$deprecatedNavigateTo(fullRoutes.onboarding.recalibrate(1), {
                        clearHistory: true,
                    });

                    return;
                }
            }

            if (false) {
                if (this.$s.getters.stationCalibrations[1]) {
                    await this.$deprecatedNavigateTo(fullRoutes.station.settings(1), {
                        clearHistory: true,
                    });

                    return;
                }
            }

            if (false) {
                await this.$deprecatedNavigateTo(
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
            await this.$deprecatedNavigateTo(getFirstRoute(services), {
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
