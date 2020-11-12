<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded"></Page>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { isAndroid } from "@nativescript/core";

import registerLifecycleEvents from "@/services/lifecycle";
import { Services } from "@/services";
import ServicesSingleton from "@/services/singleton";
import AppSettings from "@/wrappers/app-settings";
import Sqlite from "@/wrappers/sqlite";
import { promiseAfter } from "@/utilities";
import routes from "@/routes";
import { Route } from "@/routes/navigate";
import Config from "@/config";
// import { ProcessAllStationsTask } from "@/lib/process";
import { analytics } from "@nativescript/firebase/analytics";
import { ActionTypes, OurStore } from "@/store";

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

function updateStore(store: OurStore): Promise<any> {
    promiseAfter(1000)
        .then(() => store.dispatch(ActionTypes.REFRESH))
        .catch((err) => {
            console.log("refresh error", err, err ? err.stack : null);
        })
        .finally(() => updateStore(store));

    return Promise.resolve();
}

function enableLocationServices(services: Services): Promise<any> {
    // On iOS this can take a while, so we do this in the background.
    services.PhoneLocation().enableAndGetLocation();

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

    const folder = services.FileSystem().getFolder(isAndroid ? "app" : "");
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

function initializeApplication(services: Services): Promise<any> {
    const started = new Date();

    return analytics
        .logEvent({
            key: "app_open",
        })
        .then(() => {
            console.log("firebase:recorded");
        })
        .catch((message) => {
            console.log("firebase:error", message);
        })
        .then(() =>
            downloadDatabase(services, "http://192.168.0.100:8000/fk.db")
                .then(() =>
                    services
                        .CreateDb()
                        .initialize(null, false, false)
                        .then(() => services.Database().checkSettings())
                        .then(() => services.Database().purgeOldLogs())
                        .then(() => services.Store().dispatch(ActionTypes.INITIALIZE))
                        .then(() => {
                            console.log("services:ready");

                            return services
                                .Store()
                                .dispatch(ActionTypes.LOAD)
                                .then(
                                    () =>
                                        Promise.resolve()
                                            .then(() => services.DiscoverStation().startServiceDiscovery())
                                            .then(() => enableLocationServices(services))
                                            .then(() => services.PortalUpdater().start())
                                            .then(() => registerLifecycleEvents(() => services.DiscoverStation()))
                                            .then(() => updateStore(services.Store()))
                                            .then(() => resumeSession(services))
                                            .then(() => restartDiscovery(services.DiscoverStation()))
                                    // .then(() => services.Tasks().enqueue(new ProcessAllStationsTask()))
                                );
                        })
                )
                .then(() => {
                    const now = new Date();
                    const elapsed = now.getTime() - started.getTime();
                    console.log("startup:started", elapsed);
                })
                .catch((err) => {
                    console.log("startup:error:", err, err ? err.stack : null);
                })
        );
}

function getFirstRoute(services: Services): Route {
    const appSettings = new AppSettings();

    if (services.PortalInterface().isLoggedIn()) {
        return appSettings.getString("completedSetup") || appSettings.getNumber("skipCount") > 2
            ? routes.stations
            : routes.onboarding.assembleStation;
    }

    return routes.login;
}

@Component
export default class StartupScreen extends Vue {
    onPageLoaded(args): Promise<any> {
        const services: Services = ServicesSingleton;

        console.log("startup loaded");
        return initializeApplication(services).then(() => {
            console.log("developer", Config.env.developer);
            if (Config.env.developer) {
                // if (services.Store().getters.stationCalibrations[1]) {
                //     return this.$navigateTo(routes.onboarding.recalibrate, {
                //         clearHistory: true,
                //         props: {
                //             stationId: 1,
                //         },
                //
                //     });
                // } else {
                //     console.log("no test station");
                // }
                /*
                return this.$navigateTo(routes.internal.calibrate, {
                    clearHistory: true,
                    props: {
                        stationId: 2,
                        position: 0,
                    },
                });
                return this.$navigateTo(routes.onboarding.assembleStation, {
                    clearHistory: true,
                    props: {},
                });
                return this.$navigateTo(routes.login, {
                    clearHistory: true,
                    props: {},
                });
                return this.$navigateTo(routes.reader.flow, {
                    clearHistory: true,
                    props: {
                        flowName: "onboarding",
                    },
                });
                return this.$navigateTo(routes.appSettings.account, {
                    clearHistory: true,
                    props: {},
                });
                return this.$navigateTo(routes.stations, {
                    clearHistory: true,
                    props: {},
                });
                return this.$navigateTo(routes.dataSync, {
                    clearHistory: true,
                    props: {},
                });
                if (services.Store().getters.stationCalibrations[1]) {
                    // return this.$navigateTo(routes.deploy.start, {
                    // return this.$navigateTo(routes.deploy.notes, {
                    // return this.$navigateTo(routes.deploy.review, {
                    // return this.$navigateTo(routes.stationSettings, {
                    // return this.$navigateTo(routes.station.settings.firmware, {
                    return this.$navigateTo(routes.stationDetail, {
                        // return this.$navigateTo(routes.onboarding.start, {
                        clearHistory: true,
                        props: {
                            stationId: 1,
                        },
                    });
                } else {
                    console.log("no test station");
                }
				*/

                return this.$navigateTo(routes.developerMenu, {
                    clearHistory: true,
                    props: {},
                });
            }

            console.log("first navigate");

            return this.$navigateTo(getFirstRoute(services), {
                clearHistory: true,
            });
        });
    }
}
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
