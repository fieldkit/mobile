<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded"></Page>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { isAndroid } from "@nativescript/core";

import registerLifecycleEvents from "@/services/lifecycle";
import Services from "@/services/services";
import AppSettings from "@/wrappers/app-settings";
import Sqlite from "@/wrappers/sqlite";
import * as ActionTypes from "@/store/actions";
import { promiseAfter } from "@/utilities";
import routes from "@/routes";
import { Route } from "@/routes/navigate";
import Config from "@/config";
import { ProcessAllStationsTask } from "@/lib/process";
import { firebase } from "@nativescript/firebase";
import { crashlytics } from "@nativescript/firebase/crashlytics";
import { analytics } from "@nativescript/firebase/analytics";

function initializeFirebase(services): Promise<any> {
    console.log("initialize:firebase");
    return firebase
        .init({
            crashlyticsCollectionEnabled: true,
        })
        .then((response) => {
            const globalAny: any = global;
            crashlytics.setString("env", globalAny.TNS_ENV);
            console.log("firebase:initialized", response);
            return Promise.resolve(true);
        })
        .catch((error) => {
            console.log("firebase:error", error);
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

function updateStore(store): Promise<any> {
    promiseAfter(1000)
        .then(() => store.dispatch(ActionTypes.REFRESH))
        .catch((err) => {
            console.log("refresh error", err, err ? err.stack : null);
        })
        .finally(() => updateStore(store));

    return Promise.resolve();
}

function enableLocationServices(): Promise<any> {
    // On iOS this can take a while, so we do this in the background.
    Services.PhoneLocation().enableAndGetLocation();

    return Promise.resolve();
}

function resumeSession(services: Services): Promise<any> {
    return services
        .StationFirmware()
        .cleanupFirmware()
        .then(() => {
            const store = services.Store();
            if (store.state.portal.currentUser) {
                store.dispatch(ActionTypes.AUTHENTICATED);
            }
            return null;
        });
}

function downloadDatabase(services: Services, url: string): Promise<void> {
    if (true) {
        return Promise.resolve();
    }

    const progress = (total: number, copied: number, info) => {
        console.log("progress", total, copied);
    };

    const folder = Services.FileSystem().getFolder(isAndroid ? "app" : "");
    const name = "fieldkit.sqlite3";
    const destination = folder.getFile(name);

    return services
        .Conservify()
        .download({
            method: "GET",
            url: url,
            path: destination.path,
            progress: progress,
        })
        .catch((error) => {
            console.log("error", error);
            return Promise.resolve();
        })
        .then((response) => {
            new Sqlite().copy(name);
        });
}

function initializeApplication(services): Promise<any> {
    const started = new Date();

    return initializeFirebase(services).then(() => {
        console.log("firebase:app_open");
        return analytics
            .logEvent({
                key: "app_open",
            })
            .then((response) => {
                console.log("firebase:recorded", response);
                return Promise.resolve(true);
            })
            .catch((message) => {
                console.log("firebase:error", message);
                return Promise.resolve(false);
            })
            .then(() =>
                downloadDatabase(services, "http://192.168.0.100:8000/fk.db")
                    .then(() =>
                        services
                            .CreateDb()
                            .initialize()
                            .then(() => services.Database().checkSettings())
                            .then(() => services.Database().checkConfig())
                            .then(() => {
                                console.log("services:ready");

                                return Services.Store()
                                    .dispatch(ActionTypes.LOAD)
                                    .then(() =>
                                        Promise.resolve()
                                            .then(() => services.DiscoverStation().startServiceDiscovery())
                                            .then(() => Services.Store().dispatch(ActionTypes.INITIALIZE))
                                            .then(() => enableLocationServices())
                                            .then(() => services.PortalUpdater().start())
                                            .then(() => registerLifecycleEvents(() => services.DiscoverStation()))
                                            .then(() => updateStore(Services.Store()))
                                            .then(() => resumeSession(Services))
                                            .then(() => restartDiscovery(Services.DiscoverStation()))
                                            .then(() => Services.Tasks().enqueue(new ProcessAllStationsTask()))
                                    );
                            })
                    )
                    .catch((err) => {
                        console.log("startup:error:", err, err ? err.stack : null);
                    })
                    .then(() => {
                        const now = new Date();
                        const elapsed = now.getTime() - started.getTime();
                        console.log("startup:started", elapsed);
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
            console.log("developer", Config.env.developer);
            if (Config.env.developer) {
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
                return this.$navigateTo(routes.login, {
                    props: {},
                });
                return this.$navigateTo(routes.reader.flow, {
                    props: {
                        flowName: "onboarding",
                    },
                });
                return this.$navigateTo(routes.appSettings.account, {
                    props: {},
                });
                return this.$navigateTo(routes.developerMenu, {
                    props: {},
                });
                return this.$navigateTo(routes.stations, {
                    props: {},
                });
                if (Services.Store().getters.stationCalibrations[1]) {
                    // return this.$navigateTo(routes.deploy.start, {
                    return this.$navigateTo(routes.deploy.notes, {
                        // return this.$navigateTo(routes.deploy.review, {
                        // return this.$navigateTo(routes.stationSettings, {
                        // return this.$navigateTo(routes.stationDetail, {
                        // return this.$navigateTo(routes.onboarding.recalibrate, {
                        props: {
                            stationId: 1,
                        },
                    });
                } else {
                    console.log("no test station");
                }
				*/
                return this.$navigateTo(routes.dataSync, {
                    props: {},
                });
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
