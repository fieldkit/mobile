import * as i18n from "tns-i18n";
// Note: i18n detects the preferred language on the station,
// and this default language initialization does not override that
i18n("en");

import routes from "./routes";
import RadChart from "nativescript-ui-chart/vue";
import Vue from "nativescript-vue";
import VueDevtools from "nativescript-vue-devtools";
import Config from "./config";
import * as traceModule from "tns-core-modules/trace";

import Services from "./services/services";

import { initializeLogging } from "./lib/logging";
import registerLifecycleEvents from "./services/lifecycle";

try {
    initializeLogging();
}
catch (e) {
    console.log("logging error", e);
}

try {
    traceModule.setErrorHandler({
        handleError(err) {
            console.log(err);
        }
    });
    /*
    traceModule.setCategories(traceModule.categories.concat(
        traceModule.categories.Binding,
        traceModule.categories.Layout,
        traceModule.categories.Style,
        traceModule.categories.ViewHierarchy,
        traceModule.categories.VisualTreeEvents
    ));
    */
    traceModule.enable();
}
catch (e) {
    console.log("logging error", e);
}

registerLifecycleEvents();

Services.CreateDb()
    .initialize()
    .then(() => {
        Services.DiscoverStation().startServiceDiscovery();

        Vue.prototype.$stationMonitor = Services.StationMonitor();
    })
    .catch(err => {
        console.log(err);
    });

// Pass i18n's global variable to Vue
Vue.prototype._L = _L;

Vue.prototype.$portalInterface = Services.PortalInterface();

Vue.registerElement(
    "DropDown",
    () => require("nativescript-drop-down/drop-down").DropDown
);

Vue.registerElement("Mapbox", () => require("nativescript-mapbox").MapboxView);

Vue.registerElement(
    "BarcodeScanner",
    () => require("nativescript-barcodescanner").BarcodeScannerView
);

if (Config.developer.machine) {
    Vue.use(VueDevtools, { host: Config.developer.machine });
}

Vue.use(RadChart);

// Uncommment the following to see NativeScript-Vue output logs
if (Config.vue.verbose) {
    console.log("VERBOSE");
    Vue.config.silent = false;
}

new Vue({
    render: h =>
        h("frame", [
            h(
                Services.PortalInterface().isLoggedIn()
                    ? routes.home
                    : routes.login
            )
        ])
}).$start();
