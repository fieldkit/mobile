import Vuex from "vuex";
import { nearby } from "./modules/nearby";
import { stations } from "./modules/stations";
import { phone } from "./modules/phone";
import createLogger from "./logger";
import Config from "../config";

function customizeLogger() {
    return createLogger({
        filter(mutation, stateBefore, stateAfter) {
            return true;
        },
        actionFilter(action, state) {
            return true;
        },
        transformer(state) {
            return {};
        },
        mutationTransformer(mutation) {
            return mutation.type;
        },
        actionTransformer(action) {
            return action.type;
        },
        logActions: true,
        logMutations: true,
    });
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
