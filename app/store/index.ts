import _ from "lodash";
import Vuex, { Store } from "vuex";
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

type AppendStoreLog = (row: StoreLogRow) => Promise<void>;

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
    console.log("mutation:", mutation.type, JSON.stringify(mutation.payload));

    void appendLog({
        time: new Date().getTime(),
        mutation: mutation.type,
        payload: JSON.stringify(mutation.payload || {}),
        before: JSON.stringify({}),
        after: JSON.stringify({}),
    });

    return false;
}

export function stateFor(_mutation: PassedMutation, state: GlobalState | Record<string, unknown>): string {
    return JSON.stringify(state, sanitizeState);
}

function customizeLogger(appendLog: AppendStoreLog) {
    return createLogger({
        filter(mutation: PassedMutation, stateBefore: GlobalState, stateAfter: GlobalState) {
            if (mutation.type == MutationTypes.NAVIGATION) {
                return simpleMutation(appendLog, mutation);
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

            void appendLog({
                time: new Date().getTime(),
                mutation: mutation.type,
                payload: JSON.stringify(mutation.payload, sanitizeState),
                before: stateFor(mutation, stateBefore),
                after: stateFor(mutation, stateAfter),
            });

            if (mutation.type == MutationTypes.FIND || mutation.type == MutationTypes.LOSE) {
                console.log("mutation:", mutation.type, JSON.stringify(mutation.payload));
                return false;
            }
            if (mutation.type == MutationTypes.STATION_ACTIVITY || mutation.type == MutationTypes.STATION_QUERIED) {
                console.log("mutation:", mutation.type, JSON.stringify(mutation.payload));
                return false;
            }
            if (mutation.type == MutationTypes.NAVIGATION) {
                console.log("mutation:", mutation.type, mutation.payload);
                return false;
            }
            if (mutation.type == MutationTypes.STATIONS) {
                const nearby = stateAfter.nearby.stations;
                const payload = mutation.payload as { id: number; deviceId: string; name: string }[];
                const summary = payload.map((s): [number, string, string, NearbyStation] => [s.id, s.deviceId, s.name, nearby[s.deviceId]]);
                console.log("mutation:", mutation.type, JSON.stringify({ summary: summary }));
                return false;
            }
            if (/CALIBRAT/.test(mutation.type)) {
                console.log("mutation:", mutation.type);
                return false;
            }
            if (/MEDIA/.test(mutation.type)) {
                console.log("mutation:", JSON.stringify(mutation));
                return false;
            }
            if (/NOTE/.test(mutation.type)) {
                console.log("mutation:", JSON.stringify(mutation));
                return false;
            }
            if (/UPGRADE/.test(mutation.type)) {
                console.log("mutation:", JSON.stringify(mutation));
                return false;
            }

            console.log("mutation:", mutation.type);

            return false;
        },
        actionFilter(action: { type: string; payload: Record<string, unknown> }, _state: never) {
            if (action.type == ActionTypes.REFRESH) {
                return false;
            }
            if (action.type == ActionTypes.TRY_STATION_ONCE) {
                console.log("action:", action.type, JSON.stringify(action.payload));
                return false;
            }
            if (action.type == ActionTypes.QUERY_NECESSARY) {
                return false;
            }
            if (action.type == ActionTypes.QUERY_STATION) {
                console.log("action:", action.type, JSON.stringify(action.payload));
                return false;
            }
            if (action.type == ActionTypes.STATION_REPLY) {
                // eslint-disable-next-line
                const payload: any = action.payload as any;
                // eslint-disable-next-line
                const device = payload.statusReply?.status?.identity?.device;
                if (!device) {
                    console.log("action:", action.type, device);
                } else {
                    console.log("action:", action.type);
                }
                return false;
            }
            if (action.type == ActionTypes.STATIONS_LOADED) {
                console.log("action:", action.type);
                return false;
            }
            if (action.type == ActionTypes.FOUND || action.type == ActionTypes.LOST) {
                console.log("action:", action.type, JSON.stringify(action.payload));
                return false;
            }
            if (action.type == ActionTypes.REFRESH_NETWORK || action.type == ActionTypes.NETWORK_CHANGED) {
                console.log("action:", action.type, JSON.stringify(action.payload));
                return false;
            }

            console.log("action:", action.type, JSON.stringify(action.payload));

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
    return async (row: StoreLogRow): Promise<void> => {
        await rawServices.Database().addStoreLog(row);
    };
}

export default function (rawServices: Services): OurStore {
    const services = new ServiceRef(() => rawServices);
    const appender = storeLogAppender(rawServices);

    return new Vuex.Store({
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
}
