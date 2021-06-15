import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { CommonLocations, PhoneLocation, PhoneNetwork, StoredNetworkTableRow } from "../types";
import { MutationTypes, RenameStationMutation } from "../mutations";
import { ActionTypes, RefreshNetworkAction, NetworkChangedAction, StationRepliedAction } from "../actions";
import { Station } from "../types";
import { ServiceRef } from "@/services";
import { debug } from "@/lib";
import Config from "@/config";

export class PhoneState {
    network: PhoneNetwork | null = null;
    location: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
    stationNetworks: string[] = [];
    storedNetworks: string[] = [];
}

const getters = {
    directlyConnected: (state: PhoneState): boolean => {
        if (state.network && state.network.ssid) {
            return _.includes(state.stationNetworks, state.network.ssid);
        }
        return false;
    },
};

type ActionParameters = ActionContext<PhoneState, never>;

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.REFRESH_NETWORK]: async ({ dispatch, commit, state }: ActionParameters, _payload: RefreshNetworkAction) => {
            const status = await services.conservify().findConnectedNetwork();
            const newSsid = status.connectedWifi?.ssid || null;
            const oldSsid = state.network?.ssid;
            const first = state.network == null;
            if (first || newSsid != oldSsid) {
                // If you're here chasing some weird issue with WiFI,
                // the emulator will fight over stations to decide the
                // active SSID name.
                const network = new PhoneNetwork(newSsid);
                commit(MutationTypes.PHONE_NETWORK, network);
                if (!first) {
                    const emulator = _.includes([oldSsid, newSsid], "AndroidWifi") || Config.emulator;
                    if (!emulator) {
                        await dispatch(new NetworkChangedAction(network));
                    } else {
                        debug.log("emulator detected, skip wifi change");
                    }
                }
            }
        },
        [ActionTypes.STATION_REPLY]: ({ dispatch, commit }: ActionParameters, payload: StationRepliedAction) => {
            const statusReply = payload.statusReply?.networkSettings?.connected;
            if (statusReply && statusReply.ssid) {
                commit(MutationTypes.PHONE_NETWORK, new PhoneNetwork(statusReply.ssid, statusReply.create));
            }
        },
        [ActionTypes.LOAD]: async ({ dispatch }: ActionParameters) => {
            try {
                await dispatch(ActionTypes.LOAD_STORED_NETWORKS);
            } catch (error) {
                debug.log(`error loading stored networks:`, error);
            }
        },
        [ActionTypes.LOAD_STORED_NETWORKS]: async ({ commit, dispatch, state }: ActionParameters) => {
            await services
                .db()
                .getStoredNetworks()
                .then((rows) => {
                    commit(MutationTypes.LOAD_STORED_NETWORKS, rows);
                })
                .catch((e) => debug.log(ActionTypes.LOAD_STORED_NETWORKS, e));
        },
        [ActionTypes.ADD_STORED_NETWORKS]: async ({ dispatch }: ActionParameters, name) => {
            await services
                .db()
                .addStoredNetwork(name)
                .then(() => dispatch(ActionTypes.LOAD_STORED_NETWORKS))
                .catch((e) => debug.log(ActionTypes.ADD_STORED_NETWORKS, e));
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: PhoneState) => {
        Object.assign(state, new PhoneState());
    },
    [MutationTypes.PHONE_LOCATION]: (state: PhoneState, location: PhoneLocation) => {
        Vue.set(state, "location", location);
    },
    [MutationTypes.PHONE_NETWORK]: (state: PhoneState, network: PhoneNetwork) => {
        Vue.set(state, "network", network);
    },
    [MutationTypes.STATION_RENAME]: (state: PhoneState, payload: RenameStationMutation) => {
        Vue.set(state, "stationNetworks", _.uniq([...state.stationNetworks, payload.name]));
    },
    [MutationTypes.STATIONS]: (state: PhoneState, stations: Station[]) => {
        Vue.set(
            state,
            "stationNetworks",
            stations.map((station) => station.name)
        );
    },
    [MutationTypes.LOAD_STORED_NETWORKS]: (state: PhoneState, storedNetworksRows: StoredNetworkTableRow[]) => {
        Vue.set(
            state,
            "storedNetworks",
            storedNetworksRows.map((storedNetwork) => storedNetwork.name)
        );
    },
};

type ModuleType = Module<PhoneState, never>;

export const phone = (services: ServiceRef): ModuleType => {
    const state = () => new PhoneState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
