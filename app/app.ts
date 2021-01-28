import i18n from "@/lib/tns-i18n-deep";
// Note: i18n detects the preferred language on the phone,
// and this default language initialization does not override that
i18n("en");

import moment from "moment";
import Bluebird from "bluebird";
import Vue from "nativescript-vue";
import VueDevtools from "nativescript-vue-devtools";
import Vuex from "vuex";
import RadGauge from "nativescript-ui-gauge/vue";

import { initializeLogging } from "./lib/logging";
import { OurStore as Store } from "@/services";
import Services from "./services/singleton";
import navigatorFactory from "./routes/navigate";
import Config, { Build } from "./config";

import { MapboxView } from "nativescript-mapbox";
import { DropDown } from "nativescript-drop-down";
import { CheckBox } from "@nstudio/nativescript-checkbox";

import StartupScreen from "./components/StartupScreen";

function configureVueJs(services: typeof Services): Store {
    Vue.registerElement("DropDown", () => DropDown);

    Vue.registerElement("Mapbox", () => MapboxView);

    Vue.registerElement("CheckBox", () => CheckBox, {
        model: {
            prop: "checked",
            event: "checkedChange",
        },
    });

    Object.defineProperty(Vue.prototype, "$s", {
        get: function (this: Vue) {
            if (this.$store == null) {
                console.log("$s IS NULL");
            }
            return this.$store;
        },
    });

    Vue.filter("prettyReading", (value: number | undefined): string => {
        if (!value) {
            return "--";
        }
        return value.toFixed(2);
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

    const ServicesPlugin = {
        // eslint-disable-next-line
        install(Vue: any /* Vue */): void {
            // eslint-disable-next-line
            Vue.prototype.$services = Services;
        },
    };

    Vue.use(ServicesPlugin);
    Vue.use(Vuex);
    Vue.use(RadGauge);

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
    // asyncHooks: true,
});

// This causes all kinds of chaos on iOS under NS7
// global.Promise = Bluebird;

// Logging stuff, this includes our hooks to save logs as well as
// configure logging on Promise failures and funneling errors to
// Crashlytics.
void initializeLogging();

console.log(`starting: config ${JSON.stringify(Config)}`);
console.log(`starting: build ${JSON.stringify(Build)}`);

// This has to be the last thing we do. On iOS this will never return.
startVueJs(Services);
