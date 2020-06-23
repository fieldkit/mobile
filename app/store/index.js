import _ from "lodash";
import Vuex from "vuex";
import { nearby } from "./modules/nearby";
import { stations } from "./modules/stations";
import { phone } from "./modules/phone";
import { nav } from "./modules/nav";
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
            const { nearby, stations, phone, nav } = state;
            return {
                nav,
                phone,
                nearby,
                stations: {
                    deviceIds: _(stations.all)
                        .keyBy(s => s.deviceId)
                        .mapValues(s => {
                            return {
                                name: s.name,
                            };
                        })
                        .value(),
                },
            };
        },
        mutationTransformer(mutation) {
            return mutation;
        },
        actionTransformer(action) {
            return action;
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
            nav,
        },
        // This was causing a call stack error (_traverse)
        strict: false, // process.env.NODE_ENV !== "production",
    });
}
