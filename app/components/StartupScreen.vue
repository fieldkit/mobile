<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded"></Page>
</template>

<script lang="ts">
import Firebase from "nativescript-plugin-firebase";
import { Component, Vue } from "vue-property-decorator";

import registerLifecycleEvents from "@/services/lifecycle";
import Services from "@/services/services";
import AppSettings from "@/wrappers/app-settings";
import * as ActionTypes from "@/store/actions";
import * as MutationTypes from "@/store/mutations";
import { promiseAfter } from "@/utilities";
import routes from "@/routes";
import { Route } from "@/routes/navigate";
import Config from "@/config";

function initializeFirebase(services): Promise<any> {
    return Firebase.init({
        crashlyticsCollectionEnabled: true,
    })
        .then((response) => {
            console.log("firebase initialized", response);
            return Promise.resolve(true);
        })
        .catch((error) => {
            console.log("firebase error", error);
            return Promise.resolve();
        });
}

function restartDiscovery(discoverStation): null {
    if (false) {
        promiseAfter(1000 * 30)
            .then(() => discoverStation.restart())
            .catch((err) => {
                console.log("refresh error", err, err ? err.stack : null);
            })
            .finally(() => restartDiscovery(discoverStation));
    }
    return null;
}

function updateStore(store): null {
    promiseAfter(1000)
        .then(() => store.dispatch(ActionTypes.REFRESH))
        .catch((err) => {
            console.log("refresh error", err, err ? err.stack : null);
        })
        .finally(() => updateStore(store));
    return null;
}

function initializeApplication(services): Promise<any> {
    return initializeFirebase(services).then(() => {
        return Firebase.analytics
            .logEvent({
                key: "app_open",
            })
            .then((response) => {
                console.log("firebase recorded", response);
                return Promise.resolve(true);
            })
            .catch((message) => {
                console.log("firebase error", message);
                return Promise.resolve(false);
            })
            .then(() =>
                services
                    .CreateDb()
                    .initialize()
                    .then((db) => services.Database().checkConfig())
                    .then(() => {
                        // This uses a function so that the services object doesn't get spammed into the logs.
                        Services.Store().commit(MutationTypes.SERVICES, () => Services);

                        return Services.Store()
                            .dispatch(ActionTypes.LOAD)
                            .then(() =>
                                Promise.resolve()
                                    .then(() => services.DiscoverStation().startServiceDiscovery())
                                    .then(() => Services.Store().dispatch(ActionTypes.INITIALIZE))
                                    .then(() => {
                                        // Enable geolocation and start refreshing our location.
                                        Services.PhoneLocation().enableAndGetLocation();

                                        return Promise.all([services.PortalUpdater().start(), services.OnlineStatus().start()]);
                                    })
                                    .then(() => registerLifecycleEvents(() => services.DiscoverStation()))
                                    .then(() => updateStore(Services.Store()))
                                    .then(() => restartDiscovery(Services.DiscoverStation()))
                            );
                    })
                    .catch((err) => {
                        console.log("error:", err, err ? err.stack : null);
                    })
                    .then(() => {
                        console.log("started!");
                    })
            );
    });
}

function getFirstRoute(): Route {
    const appSettings = new AppSettings();

    if (Services.PortalInterface().isLoggedIn()) {
        return appSettings.getString("completedSetup") || appSettings.getNumber("skipCount") > 2
            ? routes.stations
            : routes.onboarding.assembleStation;
    }

    return routes.login;
}

@Component
export default class StartupScreen extends Vue {
    onPageLoaded(args): Promise<any> {
        console.log("startup loaded");
        return initializeApplication(Services).then(() => {
            if (Config.env.jacob) {
                /*
                return this.$navigateTo(routes.internal.calibrate, {
                    props: {
                        stationId: 2,
                        position: 0,
                    },
                });
                return this.$navigateTo(routes.onboarding.assembleStation, {
                    props: {},
                });
                if (Services.Store().getters.stationCalibrations[1]) {
                    return this.$navigateTo(routes.onboarding.recalibrate, {
                        props: {
                            stationId: 1,
                        },
                    });
                } else {
                    console.log("no test station");
                }
                return this.$navigateTo(routes.stations, {
                    props: {},
                });
				*/
                if (Services.Store().getters.stationCalibrations[1]) {
                    return this.$navigateTo(routes.deploy.notes, {
                        props: {
                            stationId: 1,
                        },
                    });
                } else {
                    console.log("no test station");
                }
            }

            console.log("first navigate");

            return this.$navigateTo(getFirstRoute(), {
                clearHistory: true,
            });
        });
    }
}
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
