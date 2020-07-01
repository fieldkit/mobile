import _ from "lodash";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { StationCreationFields, Station, AvailableStation, Module, Sensor, LegacyStation, Stream } from "../types";
import { HasLocation } from "../map-types";
import { StationTableRow, ModuleTableRow, SensorTableRow, StreamTableRow } from "../row-types";
import { HttpStatusReply } from "../http_reply";
import { GlobalState } from "./global";
import { Services, ServiceRef } from "./utilities";

export class StationsState {
    services: ServiceRef = new ServiceRef();
    error: string | boolean = false;
    all: Station[] = [];
}

const getters = {
    availableStations: (state: StationsState, getters, rootState: GlobalState): AvailableStation[] => {
        const nearby = rootState.nearby.stations;
        const stations = _(state.all)
            .keyBy(a => a.deviceId)
            .value();
        const deviceIds = _(nearby).keys().union(_.keys(stations)).uniq().value();
        const available = _(deviceIds)
            .map(deviceId => new AvailableStation(rootState.clock.wall.now, deviceId, nearby[deviceId], stations[deviceId]))
            .sortBy(available => {
                return [available.name];
            })
            .value();
        if (true) {
            console.log(
                "available",
                _.map(available, s => {
                    return {
                        name: s.name,
                        connected: s.connected,
                        nearby: nearby[s.deviceId],
                    };
                })
            );
        }
        return available;
    },
    legacyStations: (state: StationsState, getters, rootState: GlobalState): { [index: number]: LegacyStation } => {
        const nearby = rootState.nearby.stations;
        const stations = _(state.all)
            .keyBy(a => a.deviceId)
            .value();
        const deviceIds = _(nearby).keys().union(_.keys(stations)).uniq().value();
        const legacy = _(deviceIds)
            .map(deviceId => {
                const station = stations[deviceId];
                const available = new AvailableStation(rootState.clock.wall.now, deviceId, nearby[deviceId], station);
                return new LegacyStation(station, station.modules, available);
            })
            .sortBy(ls => {
                return [ls.name];
            })
            .value();
        if (true) {
            console.log(
                "legacy",
                _.map(legacy, s => {
                    return {
                        name: s.name,
                        connected: s.connected,
                        nearby: nearby[s.deviceId],
                    };
                })
            );
        }
        return _.keyBy(legacy, s => s.id);
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

class StationStatusFactory {
    constructor(private readonly statusReply: HttpStatusReply) {}

    create(): Station {
        if (!this.statusReply.status.identity.deviceId || !_.isString(this.statusReply.status.identity.deviceId)) {
            console.log("malformed status", this.statusReply);
            throw new Error(`station missing deviceId`);
        }
        if (!this.statusReply.status.identity.generationId || !_.isString(this.statusReply.status.identity.generationId)) {
            console.log("malformed status", this.statusReply);
            throw new Error(`station missing generation`);
        }

        const { latitude, longitude } = getLocationFrom(this.statusReply.status.gps);
        const deployStartTime = this.statusReply.status.recording.startedTime
            ? new Date(this.statusReply.status.recording.startedTime * 1000)
            : null;
        const modules = this.makeModules(this.statusReply);
        const streams = this.makeStreams(this.statusReply);
        const fields: StationCreationFields = {
            id: null,
            deviceId: this.statusReply.status.identity.deviceId,
            generationId: this.statusReply.status.identity.generationId,
            name: this.statusReply.status.identity.device,
            batteryLevel: this.statusReply.status.power.battery.percentage,
            consumedMemory: this.statusReply.status.memory.dataMemoryUsed,
            totalMemory: this.statusReply.status.memory.dataMemoryInstalled,
            deployStartTime: deployStartTime,
            serializedStatus: this.statusReply.serialized,
            interval: this.statusReply?.schedules?.readings?.interval || 60,
            longitude: longitude,
            latitude: latitude,
            lastSeen: new Date(),
            portalId: null,
            portalError: null,
        };
        return new Station(fields, modules, streams);
    }

    private makeStreams(statusReply: HttpStatusReply): Stream[] {
        return statusReply.streams.map(stream => {
            return Stream.fromReply(statusReply, stream);
        });
    }

    private makeModules(statusReply: HttpStatusReply): Module[] {
        if (statusReply.liveReadings && statusReply.liveReadings.length > 0) {
            const modules = _(statusReply.liveReadings)
                .map(lr =>
                    _(lr.modules)
                        .map(moduleReply => {
                            const sensors = _(moduleReply.readings)
                                .map(
                                    sensorReply =>
                                        new Sensor(null, sensorReply.sensor.name, sensorReply.sensor.unitOfMeasure, sensorReply.value, null)
                                )
                                .value();
                            return new Module(
                                null,
                                moduleReply.module.name,
                                moduleReply.module.position,
                                moduleReply.module.deviceId,
                                sensors
                            );
                        })
                        .value()
                )
                .head();
            return modules || [];
        }
        return _(statusReply.modules)
            .map(moduleReply => {
                const sensors = _(moduleReply.sensors)
                    .map(sensorReply => new Sensor(null, sensorReply.name, sensorReply.unitOfMeasure, null, null))
                    .value();
                return new Module(null, moduleReply.name, moduleReply.position, moduleReply.deviceId, sensors);
            })
            .value();
    }
}

class StationDatabaseFactory {
    constructor(
        public readonly stationRow: StationTableRow,
        public readonly modules: { [index: number]: ModuleTableRow[] },
        public readonly sensors: { [index: number]: SensorTableRow[] },
        public readonly streams: { [index: number]: StreamTableRow[] }
    ) {}

    create(): Station {
        const moduleRows = this.modules[this.stationRow.id] || [];
        const modules = _(moduleRows)
            .map(moduleRow => {
                const sensorRows = this.sensors[moduleRow.id] || [];
                const sensors = _(sensorRows)
                    .map(sensorRow => new Sensor(sensorRow.id, sensorRow.name, sensorRow.unit, sensorRow.currentReading, sensorRow.trend))
                    .value();
                return new Module(moduleRow.id, moduleRow.name, moduleRow.position, moduleRow.moduleId, sensors);
            })
            .value();

        const streamRows = this.streams[this.stationRow.id] || [];
        const streams = streamRows.map(streamRow => Stream.fromRow(streamRow));
        return new Station(this.getCreationFields(this.stationRow), modules, streams);
    }

    private getCreationFields(stationRow: StationTableRow): StationCreationFields {
        return {
            id: stationRow.id,
            deviceId: stationRow.deviceId,
            generationId: stationRow.generationId,
            name: stationRow.name,
            batteryLevel: stationRow.batteryLevel,
            consumedMemory: stationRow.consumedMemory,
            totalMemory: stationRow.totalMemory,
            deployStartTime: stationRow.deployStartTime ? new Date(stationRow.deployStartTime) : null,
            serializedStatus: stationRow.serializedStatus,
            interval: stationRow.interval,
            longitude: stationRow.longitude,
            latitude: stationRow.latitude,
            lastSeen: new Date(stationRow.lastSeen),
            portalId: stationRow.portalId,
            portalError: stationRow.portalError,
        };
    }
}

function makeStationFromStatus(statusReply: HttpStatusReply): Station {
    const factory = new StationStatusFactory(statusReply);
    return factory.create();
}

function loadStationsFromDatabase(db): Promise<Station[]> {
    return Promise.all([db.getAll(), db.getModuleAll(), db.getSensorAll(), db.getStreamAll()]).then((values: any[]) => {
        const stations: StationTableRow[] = values[0];
        const modules: { [index: number]: ModuleTableRow[] } = _.groupBy(values[1], m => m.stationId);
        const sensors: { [index: number]: SensorTableRow[] } = _.groupBy(values[2], s => s.moduleId);
        const streams: { [index: number]: StreamTableRow[] } = _.groupBy(values[3], s => s.stationId);
        // TODO Handle generation changes.
        return stations.map(stationRow => {
            const factory = new StationDatabaseFactory(stationRow, modules, sensors, streams);
            return factory.create();
        });
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
        return loadStationsFromDatabase(state.services.db()).then(stations => dispatch(ActionTypes.STATIONS_LOADED, stations));
    },
    [ActionTypes.STATIONS_LOADED]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState }, stations) => {
        commit(MutationTypes.STATIONS, stations);
        return state.services.legacy().refresh();
    },
    [ActionTypes.STATION_REPLY]: ({ commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState }, statusReply) => {
        return state.services
            .db()
            .addOrUpdateStation(makeStationFromStatus(statusReply))
            .then(station => dispatch(ActionTypes.LOAD));
    },
    [ActionTypes.STATION_PORTAL_ERROR]: (
        { commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState },
        error: StationPortalError
    ) => {
        return state.services
            .db()
            .setStationPortalError({ id: error.id }, error.error)
            .then(station => dispatch(ActionTypes.LOAD));
    },
    [ActionTypes.STATION_PORTAL_REPLY]: (
        { commit, dispatch, state }: { commit: any; dispatch: any; state: StationsState },
        reply: StationPortalReply
    ) => {
        return state.services
            .db()
            .setStationPortalError({ id: reply.id }, "" /* I really dislike this */)
            .then(() =>
                state.services
                    .db()
                    .setStationPortalId(reply)
                    .then(station => dispatch(ActionTypes.LOAD))
            );
    },
};

const mutations = {
    [MutationTypes.SERVICES]: (state: StationsState, services: () => Services) => {
        state.services = new ServiceRef(services);
    },
    [MutationTypes.STATIONS]: (state: StationsState, stations: Station[]) => {
        state.all = _.cloneDeep(stations);
        state.error = false;
    },
    [MutationTypes.ERROR]: (state: StationsState, error: string) => {
        state.error = error;
    },
};

const state = () => new StationsState();

export const stations = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
