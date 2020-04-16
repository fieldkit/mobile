import * as i18n from "tns-i18n";
// Note: i18n detects the preferred language on the station,
// and this default language initialization does not override that
i18n("en");

import routes from "./routes";
import Bluebird from "bluebird";
import RadChart from "nativescript-ui-chart/vue";
import RadGauge from "nativescript-ui-gauge/vue";
import Vue from "nativescript-vue";
import VueDevtools from "nativescript-vue-devtools";
import Config, { Build } from "./config";
import * as traceModule from "tns-core-modules/trace";

import Services from "./services/services";
import AppSettings from "./wrappers/app-settings";

import initializeLogging from "./lib/logging";
import registerLifecycleEvents from "./services/lifecycle";
import ApplicationWrapper from "./components/ApplicationWrapper";

function configureGlobalErrorHandling() {
    try {
        traceModule.setErrorHandler({
            handleError(err) {
                console.log("ERROR:");
                console.log(err);
                console.log(err.stack);
            },
        });

        traceModule.enable();

        Bluebird.onUnhandledRejectionHandled(error => {
            console.log("onUnhandledRejectionHandled", error);
            throw error;
        });

        Bluebird.onPossiblyUnhandledRejection(error => {
            console.log("onPossiblyUnhandledRejection", error);
            throw error;
        });

        // err: error trace
        // vm: component in which error occured
        // info: Vue specific error information such as lifecycle hooks, events etc.

        Vue.config.errorHandler = (err, vm, info) => {
            console.log("vuejs error:", err);
        };

        Vue.config.warnHandler = (msg, vm, info) => {
            console.log("vuejs warning:", msg);
        };
    } catch (e) {
        console.log("startup error", e, e.stack);
    }
}

function initializeApplication() {
    return Services.CreateDb()
        .initialize()
        .then(db => Services.Database().checkConfig())
        .then(() => {
            Vue.prototype.$stationMonitor = Services.StationMonitor();
            Vue.prototype.$portalInterface = Services.PortalInterface();
        })
        .catch(err => {
            console.log("startup error", err, err.stack);
        });
}

function configureVueJs() {
    Vue.registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);

    Vue.registerElement("Mapbox", () => require("nativescript-mapbox").MapboxView);

    Vue.registerElement("CheckBox", () => require("@nstudio/nativescript-checkbox").CheckBox, {
        model: {
            prop: "checked",
            event: "checkedChange",
        },
    });

    Vue.registerElement("BarcodeScanner", () => require("nativescript-barcodescanner").BarcodeScannerView);

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

function getFirstRoute() {
    const appSettings = new AppSettings();

    if (Services.PortalInterface().isLoggedIn()) {
        return appSettings.getString("completedSetup") || appSettings.getNumber("skipCount") > 2 ? routes.stations : routes.assembleStation;
    }

    return routes.login;
}

function startVueJs() {
    new Vue({
        render: h =>
            h("frame", [
                h(ApplicationWrapper, {
                    props: {
                        child: getFirstRoute(),
                    },
                }),
            ]),
    }).$start();
}

try {
    initializeLogging();
    console.log("starting: config", Config);
    console.log("starting: build", Build);
} catch (e) {
    console.log("startup error", e, e.stack);
}

configureGlobalErrorHandling();
registerLifecycleEvents();
initializeApplication();
configureVueJs();
startVueJs();
