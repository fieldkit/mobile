import _ from "lodash";
import Vue from "vue";
import * as ActionTypes from "@/store/actions";
import * as MutationTypes from "@/store/mutations";
import {
    StationCreationFields,
    Station,
    AvailableStation,
    Module,
    Sensor,
    LegacyStation,
    Stream,
    Download,
    StationPortalStatus,
    SortableStationSorter,
    Schedules,
} from "@/store/types";
import { StationRepliedAction } from "@/store/typed-actions";
import { HasLocation } from "@/store/map-types";
import { StationTableRow, ModuleTableRow, SensorTableRow, StreamTableRow, DownloadTableRow } from "@/store/row-types";
import { HttpStatusReply, AtlasStatus } from "@/store/http_reply";
import { GlobalState } from "./global";
import { ServiceRef } from "@/services";

export const STATION_PORTAL_STATUS = "STATION_PORTAL_STATUS";

export class StationsState {
    all: Station[] = [];
}

export const AvailableStationsSorter = (available: AvailableStation[]): AvailableStation[] => {
    return _.orderBy(available, [(available) => SortableStationSorter(available)]);
};

const getters = {
    stationsById: (state: StationsState): { [index: number]: Station } => {
        const stations = state.all.filter((s) => s.id);
        return _.keyBy(stations, (s) => {
            if (!s.id) {
                throw new Error("station with no id");
            }
            return s.id;
        });
    },
    availableStations: (state: StationsState, getters, rootState: GlobalState): AvailableStation[] => {
        const nearby = rootState.nearby.stations;
        const stations = _(state.all)
            .keyBy((a) => a.deviceId)
            .value();
        const deviceIds = _(nearby).keys().union(_.keys(stations)).uniq().value();
        const available = _(deviceIds)
            .map((deviceId) => new AvailableStation(deviceId, nearby[deviceId], stations[deviceId]))
            .value();

        /*
        if (false) {
            console.log(
                "available",
                _.map(available, (s) => {
                    return {
                        name: s.name,
                        connected: s.connected,
                        nearby: nearby[s.deviceId],
                    };
                })
            );
        }
		*/
        return AvailableStationsSorter(available);
    },
    legacyStations: (state: StationsState, getters, rootState: GlobalState): { [index: number]: LegacyStation } => {
        const nearby = rootState.nearby.stations;
        const stations = _(state.all)
            .keyBy((a) => a.deviceId)
            .value();
        const deviceIds = _(nearby).keys().union(_.keys(stations)).uniq().value();
        const legacy = _(deviceIds)
            .map((deviceId) => {
                const station = stations[deviceId];
                if (!station) {
                    console.log("missing:", "station", stations);
                    console.log("missing:", "device-ids", deviceIds);
                    console.log("missing:", "device-id", deviceId);
                    return [];
                }
                const available = new AvailableStation(deviceId, nearby[deviceId], station);
                return [new LegacyStation(station, station.modules, available)];
            })
            .flatten()
            .sortBy((ls) => {
                return [ls.name];
            })
            .value();

        /*
        if (false) {
            console.log(
                "legacy",
                _.map(legacy, (s) => {
                    return {
                        name: s.name,
                        connected: s.connected,
                        nearby: nearby[s.deviceId],
                    };
                })
            );
        }
		*/

        return _.keyBy(legacy, (s) => s.id);
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
        const defaultSchedules = {
            readings: [
                {
                    start: 0,
                    end: 86400,
                    interval: 60,
                },
            ],
        };
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
            schedules: this.statusReply?.schedules || defaultSchedules,
            longitude: longitude,
            latitude: latitude,
            lastSeen: new Date(),
            portalId: null,
            portalHttpError: null,
        };
        return new Station(fields, modules, streams);
    }

    private makeStreams(statusReply: HttpStatusReply): Stream[] {
        return statusReply.streams.map((stream) => {
            return Stream.fromReply(statusReply, stream);
        });
    }

    private makeModules(statusReply: HttpStatusReply): Module[] {
        if (statusReply.liveReadings && statusReply.liveReadings.length > 0) {
            const modules = _(statusReply.liveReadings)
                .map((lr) =>
                    _(lr.modules)
                        .map((moduleReply) => {
                            const sensors = _(moduleReply.readings)
                                .map(
                                    (sensorReply) =>
                                        new Sensor(null, sensorReply.sensor.name, sensorReply.sensor.unitOfMeasure, sensorReply.value, null)
                                )
                                .value();
                            return new Module(
                                null,
                                moduleReply.module.name,
                                moduleReply.module.position || 0,
                                moduleReply.module.deviceId,
                                moduleReply.module.flags,
                                moduleReply.module.status,
                                sensors
                            );
                        })
                        .value()
                )
                .head();
            return modules || [];
        }
        return _(statusReply.modules)
            .map((moduleReply) => {
                const sensors = _(moduleReply.sensors)
                    .map((sensorReply) => new Sensor(null, sensorReply.name, sensorReply.unitOfMeasure, null, null))
                    .value();
                return new Module(
                    null,
                    moduleReply.name,
                    moduleReply.position || 0,
                    moduleReply.deviceId,
                    moduleReply.flags,
                    moduleReply.status,
                    sensors
                );
            })
            .value();
    }
}

class StationDatabaseFactory {
    constructor(
        public readonly stationRow: StationTableRow,
        public readonly modules: { [index: number]: ModuleTableRow[] },
        public readonly sensors: { [index: number]: SensorTableRow[] },
        public readonly streams: { [index: number]: StreamTableRow[] },
        public readonly downloads: { [index: number]: DownloadTableRow[] }
    ) {}

    create(): Station {
        const moduleRows = this.modules[this.stationRow.id] || [];
        const modules = _(moduleRows)
            .map((moduleRow) => {
                const sensorRows = this.sensors[moduleRow.id] || [];
                const sensors = _(sensorRows)
                    .map((sensorRow) => new Sensor(sensorRow.id, sensorRow.name, sensorRow.unit, sensorRow.currentReading, sensorRow.trend))
                    .value();
                const status = this.parseModuleStatus(moduleRow.status);
                return new Module(
                    moduleRow.id,
                    moduleRow.name,
                    moduleRow.position || 0,
                    moduleRow.moduleId,
                    moduleRow.flags,
                    status,
                    sensors
                );
            })
            .value();

        const streamRows = this.streams[this.stationRow.id] || [];
        const streams = streamRows.map((streamRow) => Stream.fromRow(streamRow));
        const downloadRows = this.downloads[this.stationRow.id] || [];
        const downloads = downloadRows.map((downloadRow) => Download.fromRow(downloadRow));
        return new Station(this.getCreationFields(this.stationRow), modules, streams, downloads);
    }

    private parseModuleStatus(column: string | null): AtlasStatus | null {
        if (!column || column.length === 0) {
            return null;
        }
        try {
            return JSON.parse(column) as AtlasStatus;
        } catch (e) {
            console.log("malformed module status", column);
        }
        return null;
    }

    private parseHttpError(column: string | null): object | null {
        if (column && column.length > 0) {
            try {
                return JSON.parse(column);
            } catch (e) {
                console.log("malformed http error", column);
            }
        }
        return null;
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
            schedules: JSON.parse(stationRow.schedules) as Schedules,
            longitude: stationRow.longitude,
            latitude: stationRow.latitude,
            lastSeen: new Date(stationRow.lastSeen),
            portalId: stationRow.portalId,
            portalHttpError: this.parseHttpError(stationRow.portalHttpError),
        };
    }
}

function makeStationFromStatus(statusReply: HttpStatusReply): Station {
    const factory = new StationStatusFactory(statusReply);
    return factory.create();
}

function loadStationsFromDatabase(db): Promise<Station[]> {
    return Promise.all([db.getAll(), db.getModuleAll(), db.getSensorAll(), db.getStreamAll(), db.getDownloadAll()]).then(
        (values: any[]) => {
            const stations: StationTableRow[] = values[0];
            const modules: { [index: number]: ModuleTableRow[] } = _.groupBy(values[1], (m) => m.stationId);
            const sensors: { [index: number]: SensorTableRow[] } = _.groupBy(values[2], (s) => s.moduleId);
            const streams: { [index: number]: StreamTableRow[] } = _.groupBy(values[3], (s) => s.stationId);
            const downloads: { [index: number]: DownloadTableRow[] } = _.groupBy(values[4], (s) => s.stationId);
            // TODO Handle generation changes.
            return stations.map((stationRow) => {
                const factory = new StationDatabaseFactory(stationRow, modules, sensors, streams, downloads);
                return factory.create();
            });
        }
    );
}

type ActionParameters = { commit: any; dispatch: any; state: StationsState };

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.LOAD]: ({ commit, dispatch, state }: ActionParameters) => {
            return dispatch(ActionTypes.LOAD_STATIONS);
        },
        [ActionTypes.LOAD_STATIONS]: ({ commit, dispatch, state }: ActionParameters) => {
            return loadStationsFromDatabase(services.db()).then((stations) => dispatch(ActionTypes.STATIONS_LOADED, stations));
        },
        [ActionTypes.STATIONS_LOADED]: ({ commit, dispatch, state }: ActionParameters, stations: Station[]) => {
            commit(MutationTypes.STATIONS, stations);
        },
        [ActionTypes.STATION_REPLY]: ({ commit, dispatch, state }: ActionParameters, payload: StationRepliedAction) => {
            const statusReply = payload.statusReply;
            if ((statusReply?.errors?.length || 0) > 0) {
                return Promise.reject(new Error(`station error reply`));
            }
            return services
                .db()
                .addOrUpdateStation(makeStationFromStatus(statusReply), payload.url)
                .then((station) => dispatch(ActionTypes.LOAD_STATIONS));
        },
        [ActionTypes.STATION_PORTAL_ERROR]: ({ commit, dispatch, state }: ActionParameters, status: StationPortalStatus) => {
            return services
                .db()
                .setStationPortalError({ id: status.id }, status.error)
                .then((station) => commit(STATION_PORTAL_STATUS, status));
        },
        [ActionTypes.STATION_PORTAL_REPLY]: ({ commit, dispatch, state }: ActionParameters, status: StationPortalStatus) => {
            return services
                .db()
                .setStationPortalError({ id: status.id }, {})
                .then(() =>
                    services
                        .db()
                        .setStationPortalId(status)
                        .then((station) => commit(STATION_PORTAL_STATUS, status))
                );
        },
        [ActionTypes.UPDATE_PORTAL]: ({ commit }: ActionParameters) => {},
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: StationsState, error: string) => {
        Object.assign(state, new StationsState());
    },
    [MutationTypes.STATIONS]: (state: StationsState, stations: Station[]) => {
        Vue.set(state, "all", stations);
    },
    [STATION_PORTAL_STATUS]: (state: StationsState, status: StationPortalStatus) => {
        const station = _.first(state.all.filter((s) => s.id == status.id));
        if (!station) throw new Error("missing station");
        station.updatePortalStatus(status);
    },
};

export const stations = (services: ServiceRef) => {
    const state = () => new StationsState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
