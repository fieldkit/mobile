import Vuex from "vuex";
import createLogger from "vuex/dist/logger";
import { nearby } from "./modules/nearby";
import { stations } from "./modules/stations";
import { phone } from "./modules/phone";

export default function () {
    return new Vuex.Store({
        plugins: [createLogger()],
        modules: {
            nearby,
            stations,
            phone,
        },
        strict: process.env.NODE_ENV !== "production",
    });
}
