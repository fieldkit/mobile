import _ from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { StationsState, GlobalState, StationCreationFields, Station, HasLocation, AvailableStation, Module, Sensor } from "../types";

const getters = {
    availableStations: (state: StationsState, getters, rootState: GlobalState, rootGetters): ((now: Date) => AvailableStation[]) => (
        now: Date
    ) => {
        const nearby = rootState.nearby.stations;
        const stations = _(state.all)
            .keyBy(a => a.deviceId)
            .value();
        const deviceIds = _(nearby).keys().union(_(stations).keys().value()).uniq().value();
        return _(deviceIds)
            .map(deviceId => new AvailableStation(now, deviceId, nearby[deviceId], stations[deviceId]))
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

interface LiveSensorReading {
    sensor: SensorCapabilities;
    value: number;
}

interface LiveModuleReadings {
    module: ModuleCapabilities;
    readings: LiveSensorReading[];
}

interface LiveReadings {
    time: number;
    modules: LiveModuleReadings[];
}

interface ModuleCapabilities {
    name: string;
    deviceId: string;
    sensors: SensorCapabilities[];
}

interface SensorCapabilities {
    name: string;
    unitOfMeasure: string;
}

interface HttpStatusStatus {
    identity: any;
    gps: any;
    recording: any;
    memory: any;
    power: any;
}

interface HttpStatusReply {
    status: HttpStatusStatus;
    modules: ModuleCapabilities[];
    liveReadings: LiveReadings[];
    serialized: string;
}

interface StationTableRow extends StationCreationFields {
    id: number;
}

interface ModuleTableRow {
    id: number;
    name: string;
    moduleId: string;
    stationId: number | null;
}

interface SensorTableRow {
    id: number;
    name: string;
    unit: string;
    currentReading: number | null;
    moduleId: number | null;
}

function makeModulesFromStatus(statusReply: HttpStatusReply): Module[] {
    if (statusReply.liveReadings && statusReply.liveReadings.length > 0) {
        const modules = _(statusReply.liveReadings)
            .map(lr =>
                _(lr.modules)
                    .map(moduleReply => {
                        const sensors = _(moduleReply.readings)
                            .map(
                                sensorReply =>
                                    new Sensor(null, sensorReply.sensor.name, sensorReply.sensor.unitOfMeasure, sensorReply.value)
                            )
                            .value();
                        return new Module(null, moduleReply.module.name, moduleReply.module.deviceId, sensors);
                    })
                    .value()
            )
            .head();
        return modules || [];
    }
    return _(statusReply.modules)
        .map(moduleReply => {
            const sensors = _(moduleReply.sensors)
                .map(sensorReply => new Sensor(null, sensorReply.name, sensorReply.unitOfMeasure, null))
                .value();
            return new Module(null, moduleReply.name, moduleReply.deviceId, sensors);
        })
        .value();
}

function makeStationFromStatus(statusReply: HttpStatusReply): Station {
    if (!statusReply.status.identity.deviceId || !_.isString(statusReply.status.identity.deviceId)) {
        console.log("malformed status", statusReply);
        throw new Error(`station missing deviceId`);
    }
    if (!statusReply.status.identity.generationId || !_.isString(statusReply.status.identity.generationId)) {
        console.log("malformed status", statusReply);
        throw new Error(`station missing generation`);
    }

    const { latitude, longitude } = getLocationFrom(statusReply.status.gps);
    const deployStartTime = statusReply.status.recording.startedTime ? new Date(statusReply.status.recording.startedTime * 1000) : null;
    const modules = makeModulesFromStatus(statusReply);
    const fields: StationCreationFields = {
        id: null,
        deviceId: statusReply.status.identity.deviceId,
        generationId: statusReply.status.identity.generationId,
        name: statusReply.status.identity.device,
        batteryLevel: statusReply.status.power.battery.percentage,
        consumedMemory: statusReply.status.memory.dataMemoryUsed,
        totalMemory: statusReply.status.memory.dataMemoryInstalled,
        deployStartTime: deployStartTime,
        serializedStatus: statusReply.serialized,
        longitude: longitude,
        latitude: latitude,
        lastSeen: new Date(),
        portalId: null,
        portalError: null,
    };
    return new Station(fields, modules);
}

function loadStationsFromDatabase(db) {
    return Promise.all([db.getAll(), db.getModuleAll(), db.getSensorAll()])
        .then((values: any[]) => {
            const stations: StationTableRow[] = values[0];
            const modules: ModuleTableRow[] = values[1];
            const sensors: SensorTableRow[] = values[2];
            return {
                stations,
                modules: _(modules)
                    .groupBy(m => m.stationId)
                    .value(),
                sensors: _(sensors)
                    .groupBy(m => m.moduleId)
                    .value(),
            };
        })
        .then(tables => {
            return _(tables.stations)
                .map(stationRow => {
                    const moduleRows = tables.modules[stationRow.id] || [];
                    const modules = _(moduleRows)
                        .map(moduleRow => {
                            const sensorRows = tables.sensors[moduleRow.id] || [];
                            const sensors = _(sensorRows)
                                .map(sensorRow => new Sensor(sensorRow.id, sensorRow.name, sensorRow.unit, sensorRow.currentReading))
                                .value();
                            return new Module(moduleRow.id, moduleRow.name, moduleRow.moduleId, sensors);
                        })
                        .value();
                    return new Station(stationRow, modules);
                })
                .value();
        });
}

interface StationPortalReply {
    id: number;
    portalId: number;
}

interface StationPortalError {
    id: number;
    error: string;
}

const actions = {
    [ActionTypes.LOAD]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState }) => {
        return loadStationsFromDatabase(state.db()).then(stations => commit(MutationTypes.SET, stations));
    },
    [ActionTypes.REPLY]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState }, statusReply) => {
        return state
            .db()
            .addOrUpdateStation(makeStationFromStatus(statusReply))
            .then(station => dispatch(ActionTypes.LOAD));
    },
    [ActionTypes.STATION_PORTAL_ERROR]: (
        { commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState },
        error: StationPortalError
    ) => {
        return state
            .db()
            .setStationPortalError({ id: error.id }, error.error)
            .then(station => dispatch(ActionTypes.LOAD));
    },
    [ActionTypes.STATION_PORTAL_REPLY]: (
        { commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState },
        reply: StationPortalReply
    ) => {
        return state
            .db()
            .setStationPortalId(reply)
            .then(station => dispatch(ActionTypes.LOAD));
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
