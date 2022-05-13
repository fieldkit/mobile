import _ from "lodash";
import Vuex, { Store, Dispatch, DispatchOptions } from "vuex";
import { debug, zoned } from "@/lib";
import createLogger from "./logger";
import Config from "@/config";

import { nearby } from "./modules/nearby";
import { stations } from "./modules/stations";
import { phone } from "./modules/phone";
import { nav } from "./modules/nav";
import { network } from "./modules/network";
import { map } from "./modules/map";
import { syncing } from "./modules/syncing";
import { firmware } from "./modules/firmware";
import { media } from "./modules/media";
import { notes } from "./modules/notes";
import { portal } from "./modules/portal";
import { cal } from "./modules/cal";
import { notifications } from "./modules/notifications";

import { ActionTypes } from "./actions";
import { MutationTypes } from "./mutations";
import { Services, ServiceRef } from "@/services";
import { NearbyStation } from "./types";
import { StoreLogRow } from "./row-types";

export * from "./types";
export * from "./actions";
export * from "./mutations";

export * from "./modules/portal";
export * from "./modules/nearby";
export * from "./modules/stations";
export * from "./modules/syncing";
export * from "./modules/media";
export * from "./modules/notes";
export * from "./modules/firmware";
export * from "./modules/global";
export * from "./modules/notifications";

import { GlobalState, GlobalGetters } from "./modules/global";

export type PayloadType = Record<string, unknown> | Record<string, unknown>[];

export interface OurStore extends Store<GlobalState> {
    getters: GlobalGetters;
}

type AppendStoreLog = (rowFactory: () => StoreLogRow) => Promise<void>;

type PassedMutation = { type: string; payload: PayloadType };

function sanitizeState(key: string, value: unknown): undefined | unknown {
    if (key == "token") return "<excluded>";
    if (key == "decodedStatus") return "<excluded>";
    if (key == "serializedStatus") return "<excluded>";
    if (key == "email") return "<excluded>";
    if (key == "password") return "<excluded>";
    if (key == "passwordConfirmation") return "<excluded>";
    if (key == "photoCache") return "<excluded>";
    return value;
}

function simpleMutation(appendLog: AppendStoreLog, mutation: PassedMutation): boolean {
    debug.log("mutation:", mutation.type, JSON.stringify(mutation.payload));

    void appendLog(() => {
        return {
            time: new Date().getTime(),
            mutation: mutation.type,
            payload: JSON.stringify(mutation.payload || {}),
            before: JSON.stringify({}),
            after: JSON.stringify({}),
        };
    });

    return false;
}

export function stateFor(_mutation: PassedMutation, state: GlobalState | Record<string, unknown>): string {
    return JSON.stringify(state, sanitizeState);
}

export function customizeLogger(appendLog: AppendStoreLog) {
    return createLogger({
        filter(mutation: PassedMutation, stateBefore: GlobalState, stateAfter: GlobalState) {
            try {
                if (mutation.type == MutationTypes.NAVIGATION) {
                    debug.log("mutation:", mutation.type, JSON.stringify(mutation.payload), JSON.stringify(stateAfter.nav.frames));
                    return;
                }

                if (mutation.type == MutationTypes.STATION_QUERIED || mutation.type == MutationTypes.STATION_ACTIVITY) {
                    return;
                }

                if (mutation.type == MutationTypes.PHONE_LOCATION) {
                    return simpleMutation(appendLog, mutation);
                }

                if (mutation.type == MutationTypes.PHONE_NETWORK) {
                    return simpleMutation(appendLog, mutation);
                }

                if (mutation.type == MutationTypes.TRANSFER_PROGRESS) {
                    return simpleMutation(appendLog, mutation);
                }

                if (mutation.type == MutationTypes.MODULE_CONFIGURATION || mutation.type == MutationTypes.CLEARED_CALIBRATION) {
                    debug.log("mutation:", mutation.type, JSON.stringify(mutation.payload) /*, JSON.stringify(stateAfter.cal)*/);
                    return false;
                }

                void appendLog(() => {
                    return {
                        time: new Date().getTime(),
                        mutation: mutation.type,
                        payload: JSON.stringify(mutation.payload || {}, sanitizeState),
                        before: stateFor(mutation, stateBefore),
                        after: stateFor(mutation, stateAfter),
                    };
                });

                if (mutation.type == MutationTypes.STATIONS) {
                    const nearby = stateAfter.nearby.stations;
                    const payload = mutation.payload as { id: number; deviceId: string; name: string }[];
                    const summary = payload.map((s): [number, string, string, NearbyStation] => [
                        s.id,
                        s.deviceId,
                        s.name,
                        nearby[s.deviceId],
                    ]);
                    debug.log("mutation:", mutation.type, JSON.stringify({ summary: summary }));
                    return false;
                }

                if (mutation.type == MutationTypes.LOGIN) {
                    debug.log("mutation:", mutation.type);
                    return false;
                }

                if (mutation.payload) {
                    debug.log("mutation:", mutation.type, JSON.stringify(mutation.payload));
                } else {
                    debug.log("mutation:", mutation.type);
                }
            } catch (error) {
                debug.log("mutation-filter-error", error);
            }
            return false;
        },
        actionFilter(action: { type: string; payload: Record<string, unknown> }, _state: never) {
            try {
                if (action.type == ActionTypes.REFRESH) {
                    return false;
                }

                if (action.type == ActionTypes.REFRESH_NETWORK) {
                    return false;
                }

                if (action.type == ActionTypes.QUERY_NECESSARY) {
                    return false;
                }

                if (action.type == ActionTypes.LOAD_STATIONS) {
                    return false;
                }

                if (action.type == ActionTypes.STATION_REPLY) {
                    // eslint-disable-next-line
                    if (true) {
                        // eslint-disable-next-line
                        const payload: any = action.payload as any;
                        // eslint-disable-next-line
                        const device = payload.statusReply?.status?.identity?.deviceId;
                        // eslint-disable-next-line
                        const name = payload.statusReply?.status?.identity?.name;
                        debug.log("action:", action.type, device, name);
                    } else {
                        debug.log("action:", action.type, JSON.stringify(action.payload));
                    }
                    return false;
                }

                if (action.type == ActionTypes.STATIONS_LOADED) {
                    debug.log("action:", action.type);
                    return false;
                }

                if (action.type == ActionTypes.LOGIN) {
                    debug.log("action:", action.type);
                    return false;
                }

                if (action.payload) {
                    debug.log("action:", action.type, JSON.stringify(action.payload));
                } else {
                    debug.log("action:", action.type);
                }
            } catch (error) {
                debug.log("mutation-filter-error", error);
            }
            return false;
        },
        /*
        transformer(state: Record<string, unknown>) {
            const { stations } = state;

            return {
                ...state,
                stations: {
                    deviceIds: _(stations.all)
                        .keyBy((s) => s.deviceId)
                        .mapValues((s) => {
                            return {
                                name: s.name,
                            };
                        })
                        .value(),
                },
            };
        },
		*/
        logActions: true,
        logMutations: true,
    });
}

export function storeLogAppender(rawServices: Services): AppendStoreLog {
    return async (rowFactory: () => StoreLogRow): Promise<void> => {
        // await rawServices.Database().addStoreLog(rowFactory());
    };
}

export default function (rawServices: Services): OurStore {
    const services = new ServiceRef(() => rawServices);
    const appender = storeLogAppender(rawServices);

    const store = new Vuex.Store({
        plugins: Config.env.dev ? [customizeLogger(appender)] : [customizeLogger(appender)],
        modules: {
            nearby: nearby(services),
            stations: stations(services),
            phone: phone(services),
            nav: nav(services),
            network: network(services),
            map: map(services),
            syncing: syncing(services),
            firmware: firmware(services),
            media: media(services),
            notes: notes(services),
            portal: portal(services),
            cal: cal(services),
            notifications: notifications(services),
        },
        // This was causing a call stack error (_traverse)
        strict: false, // process.env.NODE_ENV !== "production",
    });

    const dispatchOriginal: Dispatch = store.dispatch;
    // eslint-disable-next-line
    store.dispatch = async (type: string, payload?: any, options?: DispatchOptions): Promise<any> => {
        await zoned({}, async () => {
            await dispatchOriginal(type, payload, options);
        });
    };

    return store;
}
