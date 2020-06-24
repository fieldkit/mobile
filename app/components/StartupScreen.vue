<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded"></Page>
</template>

<script>
import Firebase from "nativescript-plugin-firebase";
import Services from "../services/services";
import AppSettings from "../wrappers/app-settings";
import * as ActionTypes from "../store/actions";
import * as MutationTypes from "../store/mutations";
import { promiseAfter } from "../utilities";
import routes from "../routes";
import Config from "../config";

function initializeFirebase(services) {
    return Firebase.init({
        crashlyticsCollectionEnabled: true,
    }).catch(error => {
        console.log("firebase error", error);
        return Promise.resolve();
    });
}

function updateStore(store) {
    promiseAfter(1000)
        .then(() => {
            store.commit(MutationTypes.TICK);
            return store.dispatch(ActionTypes.REFRESH);
        })
        .then(() => {
            return updateStore(store);
        });
    return null;
}

function initializeApplication(services) {
    return Firebase.analytics
        .logEvent({
            key: "app_open",
        })
        .catch(message => {
            console.log("error", message);
            return Promise.resolve(false);
        })
        .then(() =>
            services
                .CreateDb()
                .initialize()
                .then(db => services.Database().checkConfig())
                .then(() => {
                    Services.Store().commit(MutationTypes.SERVICES, () => Services);
                    return Services.Store()
                        .dispatch(ActionTypes.LOAD)
                        .then(() => {
                            // Enable geolocation and start refreshing our location.
                            Services.PhoneLocation().enableAndGetLocation();

                            return Promise.all([
                                services.StateManager().start(),
                                services.PortalUpdater().start(),
                                services.OnlineStatus().start(),
                            ]);
                        })
                        .then(() => {
                            if (Config.env.jacob) {
                                return updateStore(Services.Store());
                            } else {
                                return services.StationMonitor().start();
                            }
                        });
                })
                .catch(err => {
                    console.log("error", err.message);
                    console.log("error", err.stack);
                })
                .then(() => {
                    console.log("started!");
                })
        );
}

function getFirstRoute() {
    const appSettings = new AppSettings();

    if (Services.PortalInterface().isLoggedIn()) {
        return appSettings.getString("completedSetup") || appSettings.getNumber("skipCount") > 2 ? routes.stations : routes.assembleStation;
    }

    return routes.login;
}

export default {
    methods: {
        onPageLoaded(args) {
            console.log("startup loaded");
            return initializeApplication(Services).then(() => {
                return this.$navigateTo(getFirstRoute(), {
                    clearHistory: true,
                });
            });
        },
    },
};
</script>

<style scoped lang="scss">
@import "../app-variables";
</style>
