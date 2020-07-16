<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded"></Page>
</template>

<script lang="ts">
import Firebase from "nativescript-plugin-firebase";
import { Component, Vue } from "vue-property-decorator";
import Services from "../services/services";
import AppSettings from "../wrappers/app-settings";
import * as ActionTypes from "../store/actions";
import * as MutationTypes from "../store/mutations";
import { promiseAfter } from "../utilities";
import routes from "../routes";
import Config from "../config";

function initializeFirebase(services): Promise<any> {
    return Firebase.init({
        crashlyticsCollectionEnabled: true,
    }).catch((error) => {
        console.log("firebase error", error);
        return Promise.resolve();
    });
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
            .catch((message) => {
                console.log("error", message);
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
                            .dispatch(ActionTypes.INITIALIZE)
                            .then(() => {
                                return Services.Store()
                                    .dispatch(ActionTypes.LOAD)
                                    .then(() => {
                                        // Enable geolocation and start refreshing our location.
                                        Services.PhoneLocation().enableAndGetLocation();

                                        return Promise.all([services.PortalUpdater().start(), services.OnlineStatus().start()]);
                                    })
                                    .then(() => {
                                        return services.DiscoverStation().startServiceDiscovery();
                                    })
                                    .then(() => {
                                        return updateStore(Services.Store());
                                    });
                            });
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

function getFirstRoute(): Vue {
    const appSettings = new AppSettings();

    if (Services.PortalInterface().isLoggedIn()) {
        return appSettings.getString("completedSetup") || appSettings.getNumber("skipCount") > 2 ? routes.stations : routes.assembleStation;
    }

    return routes.login;
}

@Component
export default class StartupScreen extends Vue {
    onPageLoaded(args): Promise<any> {
        console.log("startup loaded");
        return initializeApplication(Services).then(() => {
            if (Config.env.jacob) {
                return this.$navigateTo(routes.stations, {
                    props: {
                        stationId: 1,
                        station: Services.Store().getters.legacyStations[1],
                    },
                });
            }

            return this.$navigateTo(getFirstRoute(), {
                clearHistory: true,
            });
        });
    }
}
</script>

<style scoped lang="scss">
@import "../app-variables";
</style>
