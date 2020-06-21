import Vuex from "vuex";
import createLogger from "vuex/dist/logger";
import { nearby } from "./modules/nearby";
import { stations } from "./modules/stations";
import { phone } from "./modules/phone";
import Config from "../config";

function customizeLogger() {
    return createLogger();
}
export default function () {
    return new Vuex.Store({
        plugins: Config.env.dev ? [customizeLogger()] : [],
        modules: {
            nearby,
            stations,
            phone,
        },
        // This was causing a call stack error (_traverse)
        strict: false, // process.env.NODE_ENV !== "production",
    });
}
