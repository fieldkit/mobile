import _ from "lodash";
import Vue from "vue";
import { ActionContext } from "vuex";
import { Station, FirmwareInfo } from "../types";
import { FirmwareTableRow } from "../row-types";
import * as MutationTypes from "../mutations";
import * as ActionTypes from "../actions";
import { ServiceRef } from "@/services";

export class AvailableFirmware {
    constructor(
        public readonly id: number,
        public readonly time: Date,
        public readonly url: string,
        public readonly path: string,
        public readonly meta: object,
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
        [ActionTypes.INITIALIZE]: ({ commit, dispatch, state }: ActionParameters) => {
            return dispatch(ActionTypes.RELOAD_FIRMWARE);
        },
        [ActionTypes.AUTHENTICATED]: ({ commit, dispatch, state }: ActionParameters) => {
            const firmware = dispatch(ActionTypes.FIRMWARE_REFRESH);
            return Promise.resolve({
                firmware: firmware,
            });
        },
        [ActionTypes.FIRMWARE_REFRESH]: ({ commit, dispatch, state }: ActionParameters) => {
            return services
                .firmware()
                .downloadFirmware()
                .then(() => dispatch(ActionTypes.RELOAD_FIRMWARE));
        },
        [ActionTypes.RELOAD_FIRMWARE]: ({ commit, dispatch, state }: ActionParameters) => {
            return services
                .db()
                .getAllFirmware()
                .then((all) => all.map((row) => AvailableFirmware.fromRow(row)))
                .then((all) => commit(MutationTypes.AVAILABLE_FIRMWARE, all));
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: FirmwareState, error: string) => {
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

export const firmware = (services: ServiceRef) => {
    const state = () => new FirmwareState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
