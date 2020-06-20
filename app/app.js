import * as i18n from "tns-i18n";
// Note: i18n detects the preferred language on the phone,
// and this default language initialization does not override that
i18n("en");

import Bluebird from "bluebird";
import Vue from "nativescript-vue";
import VueDevtools from "nativescript-vue-devtools";
import RadChart from "nativescript-ui-chart/vue";
import RadGauge from "nativescript-ui-gauge/vue";
import Firebase from "nativescript-plugin-firebase";

import initializeLogging from "./lib/logging";
import registerLifecycleEvents from "./services/lifecycle";

import Services from "./services/services";
import ApplicationWrapper from "./components/ApplicationWrapper";

import Config, { Build } from "./config";

function initializeApplication(services) {
    Vue.prototype.$stationMonitor = services.StationMonitor();
    Vue.prototype.$portalInterface = services.PortalInterface();

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
                    return Promise.all([
                        services.StateManager().start(),
                        services.StationMonitor().start(),
                        services.PortalUpdater().start(),
                        services.OnlineStatus().start(),
                    ]);
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

function configureVueJs() {
    Vue.registerElement("BarcodeScanner", () => require("nativescript-barcodescanner").BarcodeScannerView);

    Vue.registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);

    Vue.registerElement("Mapbox", () => require("nativescript-mapbox").MapboxView);

    Vue.registerElement("CheckBox", () => require("@nstudio/nativescript-checkbox").CheckBox, {
        model: {
            prop: "checked",
            event: "checkedChange",
        },
    });

    Vue.use(RadChart);
    Vue.use(RadGauge);

    // Pass i18n's global variable to Vue
    Vue.prototype._L = _L;

    // Enable use of dev tools on developer machine.
    if (Config.developer.machine) {
        Vue.use(VueDevtools, { host: Config.developer.machine });
    }

    // This is extremely verbose and sometimes the only way to
    // discover why a VueJs page is breaking.
    if (Config.vue.verbose) {
        Vue.config.silent = false;
    }
}

function startVueJs() {
    configureVueJs();

    new Vue({
        render: h => h(ApplicationWrapper),
    }).$start();
}

function initializeFirebase() {
    try {
        return Firebase.init({
            crashlyticsCollectionEnabled: true,
        }).then(
            () => {},
            error => {
                console.log("firebase error", error);
            }
        );
    } catch (e) {
        console.log("firebase error", e);
        return Bluebird.resolve();
    }
}

// Configure Bluebird as the primary Promise implementation.
Bluebird.config({
    warnings: true,
    longStackTraces: true,
    cancellation: true,
    monitoring: true,
    asyncHooks: true,
});

global.Promise = Bluebird;

// Logging stuff, this includes our hooks to save logs as well as
// configure logging on Promise failures and funneling errors to
// Crashlytics.
initializeLogging();

console.log("starting: TNS_ENV", TNS_ENV);
console.log("starting: config", Config);
console.log("starting: build", Build);

// Startup VueJS and install hooks so we can show UI as soon as
// possible, especially if something goes wrong.
startVueJs();
registerLifecycleEvents();

// For some very irritating reason we can't chain this as part of
// the application startup. We end up getting errors about main
// not working to startup.
initializeFirebase().then(() => {
    return initializeApplication(Services).then(() => {
        console.log("ready");
    });
});
