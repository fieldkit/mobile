import { initializeI18n } from "@/lib/tns-i18n-deep";
// Note: i18n detects the preferred language on the phone,
// and this default language initialization does not override that
initializeI18n("en");

global["__Zone_disable_blocking"] = true;

// It's important to import this way and avoid mixing zone.js with the
// dist paths, from what I can tell.
require("zone.js/dist/zone");
require("zone.js/dist/zone-error");
require("zone.js/dist/zone-bluebird");

import _ from "lodash";
import moment from "moment";
import Bluebird from "bluebird";
import Vue from "nativescript-vue";
import VueDevtools from "nativescript-vue-devtools";
import Vuex from "vuex";

import { _L, initializeLogging } from "./lib";
import { OurStore as Store } from "@/services";
import Services from "./services/singleton";
import { navigatorFactory } from "./routes";
import Config, { Build } from "./config";

import { MapboxView } from "nativescript-mapbox";
import { DropDown } from "nativescript-drop-down";
import { CheckBox } from "@nstudio/nativescript-checkbox";

import BottomNavigation from "@nativescript-community/ui-material-bottom-navigation/vue";

import StartupScreen from "./components/StartupScreen.vue";

function configureVueJs(services: typeof Services): Store {
    Vue.registerElement("DropDown", () => DropDown);

    Vue.registerElement("Mapbox", () => MapboxView);

    Vue.registerElement("CheckBox", () => CheckBox, {
        model: {
            prop: "checked",
            event: "checkedChange",
        },
    });

    Vue.filter("prettyReading", (value: number | undefined): string => {
        if (!_.isNumber(value)) {
            return "--";
        }
        return value.toFixed(2);
    });

    Vue.filter("prettyUnixTime", (value: number | undefined): string => {
        if (!value) {
            return "N/A";
        }
        return moment(value * 1000).format("MM/DD/YYYY hh:mm:ss");
    });

    Vue.filter("prettyTime", (value: number | Date | undefined): string => {
        if (!value) {
            return "N/A";
        }
        return moment(value).format("MM/DD/YYYY hh:mm:ss");
    });

    Vue.filter("prettyDate", (value: number | Date | undefined): string => {
        if (!value) {
            return "N/A";
        }
        return moment(value).format("MM/DD/YYYY");
    });

    Vue.filter("prettyDurationSeconds", (value: number): string => {
        const duration = moment.duration(value, "seconds");
        return moment.utc(duration.asMilliseconds()).format("HH[h] mm[m]");
    });

    Vue.filter("prettyDuration", (value: number): string => {
        const duration = moment.duration(value / 1000, "seconds");
        if (value / 1000 > 3600) {
            return moment.utc(duration.asMilliseconds()).format("HH:mm:ss");
        }
        return moment.utc(duration.asMilliseconds()).format("mm:ss");
    });

    Vue.filter("prettyTimeOfDay", (value: number): string => {
        if (value == 86400) {
            value -= 60;
        }
        const duration = moment.duration(value, "seconds");
        console.log("prettyTimeOfDay", value, duration);
        return moment.utc(duration.asMilliseconds()).format("HH:mm");
    });

    Vue.filter("prettyDurationLabel", (value: number): string => {
        if (value / 1000 > 3600) {
            return "hour min sec";
        }
        return "min sec";
    });

    Vue.use(Vuex);
    Vue.use(BottomNavigation);

    // Pass i18n's global variable to Vue
    // eslint-disable-next-line
    Vue.prototype._L = _L;

    // Enable use of dev tools on developer machine.
    if (Config.debugging.machine) {
        Vue.use(VueDevtools, { host: Config.debugging.machine });
    }

    // This is extremely verbose and sometimes the only way to
    // discover why a VueJs page is breaking.
    if (Config.vue.verbose) {
        Vue.config.silent = false;
    }

    const store = services.Store();

    // eslint-disable-next-line
    Vue.prototype.$services = Services;
    // eslint-disable-next-line
    Vue.prototype.$s = store;
    // eslint-disable-next-line
    Vue.prototype.$navigateTo = navigatorFactory(store, Vue.prototype.$navigateTo);

    return store;
}

function startVueJs(services: typeof Services): void {
    const store: Store = configureVueJs(services);

    new Vue({
        store,
        render: (h) => h("Frame", { attrs: { id: "outer-frame" } }, [h(StartupScreen)]),
    }).$start();
}

// Configure Bluebird as the primary Promise implementation.
Bluebird.config({
    warnings: true,
    longStackTraces: true,
    cancellation: true,
    monitoring: true,
});

// Logging stuff, this includes our hooks to save logs as well as
// configure logging on Promise failures and funneling errors to
// Crashlytics.
void initializeLogging();

console.log(`starting: build ${JSON.stringify(Build)}`);

// This has to be the last thing we do. On iOS this will never return.
startVueJs(Services);
