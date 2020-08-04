import _ from "lodash";
import Vue from "vue";
import { Station, FirmwareInfo } from "../types";
import * as MutationTypes from "../mutations";
import * as ActionTypes from "../actions";
import { Services, ServiceRef } from "./utilities";

export interface FirmwareTableRow {
    id: number;
    time: number;
    url: string;
    path: string;
    meta: object;
    buildTime: number;
    buildNumber: string;
}

export class Firmware {
    constructor(
        public readonly id: number,
        public readonly time: Date,
        public readonly url: string,
        public readonly path: string,
        public readonly meta: object,
        public readonly simpleNumber: number
    ) {}

    public static fromRow(row: FirmwareTableRow): Firmware {
        return new Firmware(row.id, new Date(row.buildTime), row.url, row.path, row.meta, Number(row.buildNumber));
    }
}

export class FirmwareState {
    services: ServiceRef = new ServiceRef();
    available: Firmware[] = [];
    stations: { [index: number]: FirmwareInfo } = {};
}
type ModuleState = FirmwareState;
type ActionParameters = { commit: any; dispatch: any; state: ModuleState };

export const RELOAD_FIRMWARE = "RELOAD_FIRMWARE";
export const AVAILABLE_FIRMWARE = "AVAILABLE_FIRMWARE";

const getters = {};

const actions = {
    [ActionTypes.INITIALIZE]: ({ commit, dispatch, state }: ActionParameters) => {
        // return dispatch(ActionTypes.FIRMWARE_REFRESH);
    },
    [ActionTypes.AUTHENTICATED]: ({ commit, dispatch, state }: ActionParameters) => {
        const firmware = dispatch(ActionTypes.FIRMWARE_REFRESH);
        return Promise.resolve({
            firmware: firmware,
        });
    },
    [ActionTypes.FIRMWARE_REFRESH]: ({ commit, dispatch, state }: ActionParameters) => {
        return state.services
            .firmware()
            .downloadFirmware()
            .then(() => dispatch(RELOAD_FIRMWARE));
    },
    [RELOAD_FIRMWARE]: ({ commit, dispatch, state }: ActionParameters) => {
        return state.services
            .db()
            .getAllFirmware()
            .then((all) => all.map((row) => Firmware.fromRow(row)))
            .then((all) => commit(AVAILABLE_FIRMWARE, all));
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: FirmwareState, error: string) => {
        Object.assign(state, new FirmwareState());
    },
    [MutationTypes.SERVICES]: (state: FirmwareState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
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
    [AVAILABLE_FIRMWARE]: (state: FirmwareState, available: Firmware[]) => {
        if (available.length > 0) {
            Vue.set(state, "available", available[0]);
        } else {
            Vue.set(state, "available", null);
        }
    },
};

const state = () => new FirmwareState();

export const firmware = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
