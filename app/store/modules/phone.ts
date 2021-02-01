import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { CommonLocations, PhoneLocation, PhoneNetwork } from "../types";
import { MutationTypes, RenameStationMutation } from "../mutations";
import { ActionTypes, RefreshNetworkAction, NetworkChangedAction, StationRepliedAction } from "../actions";
import { Station } from "../types";
import { ServiceRef } from "@/services";

export class PhoneState {
    network: PhoneNetwork | null = null;
    location: PhoneLocation = CommonLocations.TwinPeaksEastLosAngelesNationalForest;
    stationNetworks: string[] = [];
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
            const first = state.network == null;
            if (first || newSsid != state.network?.ssid) {
                const network = new PhoneNetwork(newSsid);
                commit(MutationTypes.PHONE_NETWORK, network);
                if (!first) {
                    await dispatch(new NetworkChangedAction(network));
                }
            }
        },
        [ActionTypes.STATION_REPLY]: ({ dispatch, commit }: ActionParameters, payload: StationRepliedAction) => {
            const statusReply = payload.statusReply?.networkSettings?.connected;
            console.log("station-reply, station connected", statusReply);
            if (statusReply && statusReply.ssid) {
                commit(MutationTypes.PHONE_NETWORK, new PhoneNetwork(statusReply.ssid, statusReply.create));
            }
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
