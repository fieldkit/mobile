import * as i18n from "tns-i18n";
// Note: i18n detects the preferred language on the device,
// and this default language initialization does not override that
i18n("en");

import routes from "./routes";
import CreateDB from "./services/create-db";
import UserAuth from "./services/user-auth";
import Vue from "nativescript-vue";

// temp create and seed db
const createDB = new CreateDB();

// Pass i18n's global variable to Vue
Vue.prototype._L = _L;

const userAuth = new UserAuth();
Vue.prototype.$userAuth = userAuth;

// Uncommment the following to see NativeScript-Vue output logs
// Vue.config.silent = false;

new Vue({
    render: h => h("frame", [h(userAuth.isLoggedIn() ? routes.home : routes.login)])
}).$start();
