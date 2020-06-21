import _ from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";

interface StationsState {
    db: any;
    all: any[];
    error: string | null;
}

interface Location {
    latitude: number | null;
    longitude: number | null;
}

const getters = {};

function getLocationFrom(o: Location): Location {
    const latitude = o && o.latitude && o.latitude < 90 && o.latitude > -90 ? o.latitude : null;
    const longitude = o && o.longitude && o.longitude < 180 && o.longitude > -180 ? o.longitude : null;
    return {
        latitude,
        longitude,
    };
}

function makeStationFromStatus(statusReply) {
    const { latitude, longitude } = getLocationFrom(statusReply.status.gps);
    return {
        deviceId: statusReply.status.identity.deviceId,
        generationId: statusReply.status.identity.generationId,
        name: statusReply.status.identity.device,
        serialized: statusReply.serialized,
        batteryLevel: statusReply.status.power.battery.percentage,
        consumedMemory: statusReply.status.memory.dataMemoryUsed,
        totalMemory: statusReply.status.memory.dataMemoryInstalled,
        longitude: longitude,
        latitude: latitude,
    };
}

const actions = {
    [ActionTypes.LOAD]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState }) => {
        return state
            .db()
            .getAll()
            .then(
                stations => commit(MutationTypes.SET, stations),
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
                        .then(stations => commit(MutationTypes.SET, stations)),
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
    [MutationTypes.SET]: (state: StationsState, stations) => {
        state.all = _.cloneDeep(stations);
        state.error = null;
    },
    [MutationTypes.ERROR]: (state: StationsState, error: string) => {
        state.error = error;
    },
};

const state = () => {
    return {
        db: null,
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
