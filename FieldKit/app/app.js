import * as i18n from "tns-i18n";
// Note: i18n detects the preferred language on the station,
// and this default language initialization does not override that
i18n("en");

import routes from "./routes";
import RadChart from "nativescript-ui-chart/vue";
import RadGauge from "nativescript-ui-gauge/vue";
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
    console.log("startup error", e, e.stack);
}

try {
    traceModule.setErrorHandler({
        handleError(err) {
			console.log("ERROR:");
            console.log(err);
            console.log(err.stack);
        }
    });

    traceModule.enable();
}
catch (e) {
    console.log("startup error", e, e.stack);
}

registerLifecycleEvents();

Services.CreateDb()
    .initialize()
    .then(() => {
		console.log("checking config");
        const dbInterface = Services.Database();
        return dbInterface.checkConfig().then(c => {
			console.log('config', c);
		});
    })
    .then(() => {
        Vue.prototype.$stationMonitor = Services.StationMonitor();
		Vue.prototype.$portalInterface = Services.PortalInterface();
    })
    .catch(err => {
        console.log("startup error", err, err.stack);
    });

// Pass i18n's global variable to Vue
Vue.prototype._L = _L;

Vue.registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);

Vue.registerElement("Mapbox", () => require("nativescript-mapbox").MapboxView);

Vue.registerElement(
  'CheckBox',
  () => require('@nstudio/nativescript-checkbox').CheckBox,
  {
    model: {
      prop: 'checked',
      event: 'checkedChange'
    }
  }
);

Vue.registerElement("BarcodeScanner", () => require("nativescript-barcodescanner").BarcodeScannerView);

if (Config.developer.machine) {
    Vue.use(VueDevtools, { host: Config.developer.machine });
}

Vue.use(RadChart);
Vue.use(RadGauge);

// Uncommment the following to see NativeScript-Vue output logs
if (Config.vue.verbose) {
    Vue.config.silent = false;
}

console.log('config', Config);

new Vue({
    render: h =>
        h("frame", [
            h(
                Services.PortalInterface().isLoggedIn()
                    ? routes.assembleStation
                    : routes.login
            )
        ])
}).$start();
