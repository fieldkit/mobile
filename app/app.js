import * as i18n from "tns-i18n";
// Note: i18n detects the preferred language on the phone,
// and this default language initialization does not override that
i18n("en");

import Bluebird from "bluebird";
import Vue from "nativescript-vue";
import RadChart from "nativescript-ui-chart/vue";
import RadGauge from "nativescript-ui-gauge/vue";
import VueDevtools from "nativescript-vue-devtools";

import initializeLogging from "./lib/logging";
import registerLifecycleEvents from "./services/lifecycle";

import Services from "./services/services";
import ApplicationWrapper from "./components/ApplicationWrapper";
import StartupScreen from "./components/StartupScreen";

import Config, { Build } from "./config";

function configureVueJs(services) {
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

    Vue.prototype.$stationMonitor = services.StationMonitor();
    Vue.prototype.$portalInterface = services.PortalInterface();
}

function startVueJs(services) {
    configureVueJs(services);

    new Vue({
        render: h =>
            h("frame", [
                h(ApplicationWrapper, {
                    props: {
                        child: StartupScreen,
                    },
                }),
            ]),
    }).$start();
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
initializeLogging(Services);
console.log("starting: config", Config);
console.log("starting: build", Build);

// Startup VueJS and install hooks so we can show UI as soon as
// possible, especially if something goes wrong.
registerLifecycleEvents(Services);

// This has to be the last thing we do. On iOS this will never return.
startVueJs(Services);
