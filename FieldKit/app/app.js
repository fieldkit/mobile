import Vue from "nativescript-vue";

import routes from "./routes";
import UserAuth from "./services/user-auth";

// Uncommment the following to see NativeScript-Vue output logs
// Vue.config.silent = false;

const userAuth = new UserAuth();
Vue.prototype.$userAuth = userAuth;

new Vue({
  render: h => h("frame", [h(userAuth.isLoggedIn() ? routes.home : routes.login)])
}).$start();
