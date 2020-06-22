<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded"></Page>
</template>

<script>
import Firebase from "nativescript-plugin-firebase";
import Services from "../services/services";
import AppSettings from "../wrappers/app-settings";
import routes from "../routes";

function initializeFirebase(services) {
    return Firebase.init({
        crashlyticsCollectionEnabled: true,
    }).catch(error => {
        console.log("firebase error", error);
        return Promise.resolve();
    });
}

function initializeApplication(services) {
    return initializeFirebase(services).then(() => {
        return services
            .CreateDb()
            .initialize()
            .then(db => services.Database().checkConfig())
            .then(() => {
                return Promise.all([
                    services.StateManager().start(),
                    services.StationMonitor().start(),
                    services.PortalUpdater().start(),
                    services.OnlineStatus().start(),
                ]);
            })
            .catch(err => {
                console.log("ERROR", err.message);
                console.log("ERROR", err.stack);
            });
    });
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
            console.log("page loaded");
            return initializeApplication(Services).then(() => {
                const page = getFirstRoute();
                return this.$navigateTo(page, {
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
