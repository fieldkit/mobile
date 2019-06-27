import * as i18n from "tns-i18n";
// Note: i18n detects the preferred language on the station,
// and this default language initialization does not override that
i18n("en");

import routes from "./routes";
import CreateDB from "./services/create-db";
import UserAuth from "./services/user-auth";
import QueryStation from "./services/query-station";
import DiscoverStation from "./services/discover-station";
import Vue from "nativescript-vue";

// temp: query station and then create database
const queryStation = new QueryStation();

queryStation.queryIdentity("http://192.168.0.100:2380")
    .then((response) => {
        const createDB = new CreateDB(response);
    });

queryStation.queryIdentity("https://192.168.0.100:2382")
    .then((response) => {
        const createDB = new CreateDB(response);
    });

// temp, just checking
const discoverStation = new DiscoverStation();
discoverStation.startServiceDiscovery();

// Pass i18n's global variable to Vue
Vue.prototype._L = _L;

const userAuth = new UserAuth();
Vue.prototype.$userAuth = userAuth;

// Uncommment the following to see NativeScript-Vue output logs
// Vue.config.silent = false;

new Vue({
    render: h =>
        h("frame", [h(userAuth.isLoggedIn() ? routes.home : routes.login)])
}).$start();
