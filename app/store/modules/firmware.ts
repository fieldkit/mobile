import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { Station, FirmwareInfo } from "../types";
import { FirmwareTableRow } from "../row-types";
import { ActionTypes, UpgradeStationFirmwareAction } from "../actions";
import { MutationTypes } from "../mutations";
import { ServiceRef, TransferProgress } from "@/services";

export class AvailableFirmware {
    constructor(
        public readonly id: number,
        public readonly time: Date,
        public readonly url: string,
        public readonly path: string,
        public readonly meta: Record<string, unknown>,
        public readonly simpleNumber: number
    ) {}

    public static fromRow(row: FirmwareTableRow): AvailableFirmware {
        return new AvailableFirmware(row.id, new Date(row.buildTime), row.url, row.path, row.meta, Number(row.buildNumber));
    }
}

export interface UpgradeStatus {
    busy?: boolean;
    error?: boolean;
    firmware?: boolean;
    success?: boolean;
    done?: boolean;
}

export interface UpgradeInfo {
    status: UpgradeStatus | null;
    progress: TransferProgress | null;
}

export class FirmwareState {
    available: AvailableFirmware[] = [];
    stations: { [index: number]: FirmwareInfo } = {};
    status: { [index: number]: UpgradeInfo } = {};
}

type ModuleState = FirmwareState;
type ActionParameters = ActionContext<ModuleState, never>;

const getters = {};

class UpgradeStatusMutation {
    type = MutationTypes.UPGRADE_STATUS;

    constructor(public readonly stationId: number, public readonly status: UpgradeStatus) {}
}

class UpgradeProgressMutation {
    type = MutationTypes.UPGRADE_PROGRESS;

    constructor(public readonly stationId: number, public readonly progress: TransferProgress) {}
}

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.INITIALIZE]: async ({ commit, dispatch, state }: ActionParameters) => {
            await dispatch(ActionTypes.RELOAD_FIRMWARE);
        },
        [ActionTypes.AUTHENTICATED]: async ({ commit, dispatch, state }: ActionParameters) => {
            await dispatch(ActionTypes.FIRMWARE_REFRESH);
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
            console.log("checking for firmware");
            return services
                .firmware()
                .haveFirmware()
                .then((yes) => {
                    console.log("firmware check", yes);

                    if (!yes) {
                        console.log("no firmware");
                        commit(new UpgradeStatusMutation(payload.stationId, { done: true, error: true, firmware: true }));
                        return;
                    }

                    commit(new UpgradeStatusMutation(payload.stationId, { done: false, busy: true }));

                    console.log("upgrading firmware");
                    return services
                        .firmware()
                        .upgradeStation(payload.url, (progress) => {
                            commit(new UpgradeProgressMutation(payload.stationId, progress));
                        })
                        .then((status) => {
                            console.log("status", status);
                            commit(new UpgradeStatusMutation(payload.stationId, { ...status, ...{ done: true } }));
                        })
                        .catch((err) => {
                            console.log("error", err, err.stack);
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
            Vue.set(state, "available", available[0]);
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
