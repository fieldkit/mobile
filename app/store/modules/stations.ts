import _ from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { StationsState, GlobalState, StationCreationFields, Station, HasLocation, AvailableStation } from "../types";

const getters = {
    availableStations: (state: StationsState, getters, rootState: GlobalState, rootGetters): AvailableStation[] => {
        const nearby = rootState.nearby.stations;
        const stations = _(state.all)
            .keyBy(a => a.deviceId)
            .value();
        const deviceIds = _(nearby).keys().union(_(stations).keys().value()).uniq().value();
        return _(deviceIds)
            .map(deviceId => new AvailableStation(deviceId, nearby[deviceId], stations[deviceId]))
            .sortBy(available => {
                return [available.name];
            })
            .value();
    },
};

function getLocationFrom(o: HasLocation): HasLocation {
    const latitude = o && o.latitude && o.latitude < 90 && o.latitude > -90 ? o.latitude : null;
    const longitude = o && o.longitude && o.longitude < 180 && o.longitude > -180 ? o.longitude : null;
    return {
        latitude,
        longitude,
    };
}

interface HttpStatusReply {
    status: any;
    serialized: string;
}

function makeStationFromStatus(statusReply: HttpStatusReply): Station {
    const { latitude, longitude } = getLocationFrom(statusReply.status.gps);
    const fields: StationCreationFields = {
        deviceId: statusReply.status.identity.deviceId,
        generationId: statusReply.status.identity.generationId,
        name: statusReply.status.identity.device,
        batteryLevel: statusReply.status.power.battery.percentage,
        consumedMemory: statusReply.status.memory.dataMemoryUsed,
        totalMemory: statusReply.status.memory.dataMemoryInstalled,
        longitude: longitude,
        latitude: latitude,
        serializedStatus: statusReply.serialized,
    };
    return new Station(fields);
}

const actions = {
    [ActionTypes.LOAD]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState }) => {
        return state
            .db()
            .getAll()
            .then(
                rows =>
                    commit(
                        MutationTypes.SET,
                        rows.map(row => new Station(row))
                    ),
                error => commit(MutationTypes.ERROR, error)
            );
    },
    [ActionTypes.REPLY]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState }, statusReply) => {
        return state
            .db()
            .addOrUpdateStation(makeStationFromStatus(statusReply))
            .then(
                station =>
                    state
                        .db()
                        .getAll()
                        .then(rows =>
                            commit(
                                MutationTypes.SET,
                                rows.map(row => new Station(row))
                            )
                        ),
                error => commit(MutationTypes.ERROR, error.message)
            );
    },
};

const mutations = {
    [MutationTypes.SERVICES]: (state: StationsState, services: any) => {
        state.db = function () {
            return services().Database();
        };
    },
    [MutationTypes.SET]: (state: StationsState, stations: Station[]) => {
        state.all = _.cloneDeep(stations);
        state.error = false;
    },
    [MutationTypes.ERROR]: (state: StationsState, error: string) => {
        state.error = error;
    },
};

const state = (): StationsState => {
    return {
        db: () => new Error(),
        error: false,
        all: [],
    };
};

export const stations = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
