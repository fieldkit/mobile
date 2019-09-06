import * as i18n from "tns-i18n";
// Note: i18n detects the preferred language on the station,
// and this default language initialization does not override that
i18n("en");

import routes from "./routes";
import CreateDB from "./services/create-db";
import PortalInterface from "./services/portal-interface";
import StationMonitor from "./services/station-monitor";
import DiscoverStation from "./services/discover-station";
import RadChart from "nativescript-ui-chart/vue";
import Vue from "nativescript-vue";
import VueDevtools from 'nativescript-vue-devtools'
import Config from "./config";

const discoverStation = new DiscoverStation();
discoverStation.startServiceDiscovery();

const createDB = new CreateDB();
createDB.initialize().then(() => {
    const stationMonitor = new StationMonitor(discoverStation);
    Vue.prototype.$stationMonitor = stationMonitor;
});

// Pass i18n's global variable to Vue
Vue.prototype._L = _L;

const portalInterface = new PortalInterface();
Vue.prototype.$portalInterface = portalInterface;

Vue.registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);

Vue.registerElement("Mapbox", () => require("nativescript-mapbox").MapboxView);

Vue.registerElement("BarcodeScanner", () => require("nativescript-barcodescanner").BarcodeScannerView);

if (Config.developer.machine) {
    Vue.use(VueDevtools, { host: Config.developer.machine })
}

Vue.use(RadChart);

// Uncommment the following to see NativeScript-Vue output logs
// Vue.config.silent = false;

new Vue({
    render: h => h("frame", [h(portalInterface.isLoggedIn() ? routes.home : routes.login)])
}).$start();
