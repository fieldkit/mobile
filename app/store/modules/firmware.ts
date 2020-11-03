import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { Station, FirmwareInfo } from "../types";
import { FirmwareTableRow } from "../row-types";
import { ActionTypes } from "../actions";
import { MutationTypes } from "../mutations";
import { ServiceRef } from "@/services";

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

export class FirmwareState {
    available: AvailableFirmware[] = [];
    stations: { [index: number]: FirmwareInfo } = {};
}
type ModuleState = FirmwareState;
type ActionParameters = ActionContext<ModuleState, never>;

const getters = {};

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
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: FirmwareState) => {
        Object.assign(state, new FirmwareState());
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
