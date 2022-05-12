import _ from "lodash";
import Vue from "vue";
import moment from "moment";
import { ActionContext, Module } from "vuex";
import { debug } from "@/lib";
import { Station, FirmwareInfo } from "../types";
import { FirmwareTableRow } from "../row-types";
import { ActionTypes, UpgradeStationFirmwareAction } from "../actions";
import { MutationTypes } from "../mutations";
import { ServiceRef, TransferProgress } from "@/services";

function parseMeta(raw: string | Record<string, string>): Record<string, string> {
    if (_.isString(raw)) {
        return JSON.parse(raw) as Record<string, string>;
    }
    return raw;
}

export class AvailableFirmware {
    public readonly buildTimeUnix: number;
    public readonly version: string;

    constructor(
        public readonly id: number,
        public readonly time: Date,
        public readonly module: string,
        public readonly url: string,
        public readonly path: string,
        public readonly meta: Record<string, string> | string,
        public readonly simpleNumber: number
    ) {
        const availableMeta = parseMeta(meta);
        const availableTime = moment.utc(availableMeta["Build-Time"], "YYYYMMDD_hhmmss");
        this.buildTimeUnix = availableTime.unix();
        this.version = availableMeta["Build-Version"];
    }

    public static fromRow(row: FirmwareTableRow): AvailableFirmware {
        return new AvailableFirmware(row.id, new Date(row.buildTime), row.module, row.url, row.path, row.meta, Number(row.buildNumber));
    }
}

export interface UpgradeStatus {
    busy?: boolean;
    error?: boolean;
    firmware?: boolean;
    success?: boolean;
    done?: boolean;
    sdCard?: boolean;
}

export interface UpgradeInfo {
    status: UpgradeStatus | null;
    progress: TransferProgress | null;
}

export class FirmwareState {
    available: AvailableFirmware[] | null = null;
    stations: { [index: number]: FirmwareInfo } = {};
    status: { [index: number]: UpgradeInfo } = {};
}

type ModuleState = FirmwareState;
type ActionParameters = ActionContext<ModuleState, never>;

const getters = {};

export class UpgradeStatusMutation {
    type = MutationTypes.UPGRADE_STATUS;

    constructor(public readonly stationId: number, public readonly status: UpgradeStatus) {}
}

class UpgradeProgressMutation {
    type = MutationTypes.UPGRADE_PROGRESS;

    constructor(public readonly stationId: number, public readonly progress: TransferProgress) {}
}

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.LOAD]: async ({ commit, dispatch, state }: ActionParameters) => {
            try {
                await dispatch(ActionTypes.RELOAD_FIRMWARE);
            } catch (error) {
                debug.log(`error loading firmware:`, error);
            }
        },
        [ActionTypes.FIRMWARE_REFRESH]: async ({ commit, dispatch, state }: ActionParameters) => {
            await services
                .firmware()
                .downloadFirmware()
                .then(() => dispatch(ActionTypes.RELOAD_FIRMWARE));
        },
        [ActionTypes.RELOAD_FIRMWARE]: async ({ commit, dispatch, state }: ActionParameters) => {
            await services
                .db()
                .getAllFirmware()
                .then((all) => all.map((row) => AvailableFirmware.fromRow(row)))
                .then((all) => commit(MutationTypes.AVAILABLE_FIRMWARE, all));
        },
        [ActionTypes.UPGRADE_STATION_FIRMWARE]: ({ commit, dispatch, state }: ActionParameters, payload: UpgradeStationFirmwareAction) => {
            debug.log("checking for firmware");
            return services
                .firmware()
                .haveFirmware(payload.firmwareId)
                .then((yes) => {
                    debug.log("firmware check", yes);

                    if (!yes) {
                        debug.log("no firmware");
                        commit(new UpgradeStatusMutation(payload.stationId, { done: true, error: true, firmware: true }));
                        return;
                    }

                    commit(new UpgradeStatusMutation(payload.stationId, { done: false, busy: true }));

                    debug.log("upgrading firmware");
                    return services
                        .firmware()
                        .upgradeStation(
                            payload.url,
                            (progress) => {
                                commit(new UpgradeProgressMutation(payload.stationId, progress));
                            },
                            payload.firmwareId
                        )
                        .then((status) => {
                            debug.log("upgrade status", status);
                            commit(new UpgradeStatusMutation(payload.stationId, { ...status, ...{ done: true } }));
                        })
                        .catch((err) => {
                            debug.log("upgrade error", err);
                            commit(new UpgradeStatusMutation(payload.stationId, { done: true, error: true }));
                        });
                });
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: FirmwareState) => {
        Object.assign(state, new FirmwareState());
    },
    [MutationTypes.UPGRADE_STATUS]: (state: FirmwareState, payload: UpgradeStatusMutation) => {
        const existing = state.status[payload.stationId] || {};
        Vue.set(state.status, payload.stationId, {
            status: payload.status,
            progress: existing.progress,
        });
    },
    [MutationTypes.UPGRADE_PROGRESS]: (state: FirmwareState, payload: UpgradeProgressMutation) => {
        const existing = state.status[payload.stationId] || {};
        Vue.set(state.status, payload.stationId, {
            status: existing.status,
            progress: payload.progress,
        });
    },
    [MutationTypes.STATIONS]: (state: FirmwareState, stations: Station[]) => {
        state.stations = _(stations)
            .map((s) => {
                const fw = s.firmwareInfo();
                if (!fw) {
                    return [];
                }
                return [s.id, fw];
            })
            .fromPairs()
            .value();
    },
    [MutationTypes.AVAILABLE_FIRMWARE]: (state: FirmwareState, available: AvailableFirmware[]) => {
        if (available.length > 0) {
            Vue.set(state, "available", available);
        } else {
            Vue.set(state, "available", null);
        }
    },
};

type ModuleType = Module<FirmwareState, never>;

export const firmware = (services: ServiceRef): ModuleType => {
    const state = () => new FirmwareState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
