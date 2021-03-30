import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module as VuexModule } from "vuex";
import { MutationTypes } from "../mutations";
import {
    StationCreationFields,
    Station,
    AvailableStation,
    DiscoveringStation,
    Module,
    Sensor,
    LegacyStation,
    Stream,
    Download,
    StationPortalStatus,
    SortableStationSorter,
    Schedules,
    PortalError,
    NoPortalError,
} from "@/store/types";
import { ActionTypes, StationRepliedAction, PortalReplyAction, PortalErrorAction } from "@/store/actions";
import { HasLocation } from "@/store/map-types";
import { StationTableRow, ModuleTableRow, SensorTableRow, StreamTableRow, DownloadTableRow } from "@/store/row-types";
import { HttpStatusReply, ModuleConfiguration } from "@/store/http-types";
import { StationsState, GlobalState } from "./global";
import { ServiceRef, DatabaseInterface } from "@/services";

export const AvailableStationsSorter = (available: AvailableStation[]): AvailableStation[] => {
    return _.orderBy(available, [(available) => SortableStationSorter(available)]);
};

function makeAvailableStations(state: StationsState, rootState: GlobalState): AvailableStation[] {
    const nearby = rootState.nearby.stations;
    const stations = _(state.all)
        .keyBy((a) => a.deviceId)
        .value();
    const deviceIds = _.keys(stations);
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
}

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
    availableStationsById: (state: StationsState, _getters: never, rootState: GlobalState): { [index: number]: AvailableStation } => {
        return _.keyBy(makeAvailableStations(state, rootState), (s) => s.id);
    },
    availableStations: (state: StationsState, _getters: never, rootState: GlobalState): AvailableStation[] => {
        return makeAvailableStations(state, rootState);
    },
    discovering: (state: StationsState, _getters: never, rootState: GlobalState): DiscoveringStation[] => {
        const nearby = Object.keys(rootState.nearby.stations);
        const known = state.all.map((s) => s.deviceId);
        const newIds = _.difference(nearby, known);
        console.log(`discovering: ${JSON.stringify({ nearby, known, newIds })}`);
        return newIds.map((deviceId) => new DiscoveringStation(deviceId, rootState.nearby.stations[deviceId].url));
    },
    legacyStations: (state: StationsState, _getters: never, rootState: GlobalState): { [index: number]: LegacyStation } => {
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

function coerceIdType(value: string | Buffer | undefined): string | null {
    if (!value) return null;
    if (Buffer.isBuffer(value)) return value.toString("hex");
    return value;
}

class StationStatusFactory {
    constructor(private readonly statusReply: HttpStatusReply) {}

    create(): Station {
        const deviceId = coerceIdType(this.statusReply.status?.identity?.deviceId);
        if (!deviceId) {
            console.log("malformed status (device-id)", this.statusReply);
            throw new Error(`station missing deviceId`);
        }

        const generationId = coerceIdType(this.statusReply.status?.identity?.generationId);
        if (!generationId) {
            console.log("malformed status (generation)", this.statusReply);
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
            network: [],
        };
        const fields: StationCreationFields = {
            id: null,
            userId: null,
            archived: false,
            deviceId: deviceId,
            generationId: generationId,
            name: this.statusReply.status.identity.name,
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
                                        new Sensor(
                                            null,
                                            sensorReply.sensor.name,
                                            sensorReply.sensor.number,
                                            sensorReply.sensor.unitOfMeasure,
                                            sensorReply.value,
                                            sensorReply.uncalibrated,
                                            null
                                        )
                                )
                                .value();
                            return new Module(
                                null,
                                null,
                                moduleReply.module.name,
                                moduleReply.module.position || 0,
                                moduleReply.module.moduleId,
                                moduleReply.module.flags,
                                moduleReply.module.configuration,
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
                    .map(
                        (sensorReply) => new Sensor(null, sensorReply.name, sensorReply.number, sensorReply.unitOfMeasure, null, null, null)
                    )
                    .value();
                return new Module(
                    null,
                    null,
                    moduleReply.name,
                    moduleReply.position || 0,
                    moduleReply.moduleId,
                    moduleReply.flags,
                    moduleReply.configuration,
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
                    .map(
                        (sensorRow) =>
                            new Sensor(
                                sensorRow.id,
                                sensorRow.name,
                                sensorRow.position,
                                sensorRow.unit,
                                sensorRow.reading,
                                sensorRow.uncalibrated,
                                sensorRow.trend
                            )
                    )
                    .value();
                const configuration = this.parseModuleConfiguration(moduleRow.status);
                return new Module(
                    moduleRow.id,
                    moduleRow.stationId,
                    moduleRow.name,
                    moduleRow.position || 0,
                    moduleRow.moduleId,
                    moduleRow.flags,
                    configuration,
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

    private parseModuleConfiguration(column: string | null): ModuleConfiguration | null {
        if (!column || column.length === 0) {
            return null;
        }
        try {
            return JSON.parse(column) as ModuleConfiguration;
        } catch (e) {
            console.log("malformed module configuration", column);
        }
        return null;
    }

    private parseHttpError(column: string | null): PortalError | null {
        if (column && column.length > 0) {
            try {
                return JSON.parse(column) as PortalError;
            } catch (e) {
                console.log("malformed http error", column);
            }
        }
        return null;
    }

    private getCreationFields(stationRow: StationTableRow): StationCreationFields {
        return {
            id: stationRow.id,
            userId: stationRow.userId,
            deviceId: stationRow.deviceId,
            generationId: stationRow.generationId,
            name: stationRow.name,
            archived: stationRow.archived,
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

type LoadStationsValue = [StationTableRow[], ModuleTableRow[], SensorTableRow[], StreamTableRow[], DownloadTableRow[]];

async function loadStationsFromDatabase(db: DatabaseInterface): Promise<Station[]> {
    return await Promise.all([db.getAll(), db.getModuleAll(), db.getSensorAll(), db.getStreamAll(), db.getDownloadAll()]).then(
        async (values: LoadStationsValue) => {
            const stations: StationTableRow[] = values[0];
            const moduleRows: ModuleTableRow[] = values[1];
            const sensorsRows: SensorTableRow[] = values[2];
            const streamsRows: StreamTableRow[] = values[3];
            const downloadsRows: DownloadTableRow[] = values[4];

            console.log(
                `loading stations: ${JSON.stringify({
                    stations: stations.length,
                    modules: moduleRows.length,
                    sensors: sensorsRows.length,
                    streams: streamsRows.length,
                    downloads: downloadsRows.length,
                })}`
            );

            const modules: { [index: number]: ModuleTableRow[] } = _.groupBy(moduleRows, (m) => m.stationId);
            const sensors: { [index: number]: SensorTableRow[] } = _.groupBy(sensorsRows, (s) => s.moduleId);
            const streams: { [index: number]: StreamTableRow[] } = _.groupBy(streamsRows, (s) => s.stationId);
            const downloads: { [index: number]: DownloadTableRow[] } = _.groupBy(downloadsRows, (s) => s.stationId);

            // TODO Handle generation changes.
            return await Promise.all(
                stations.map(async (stationRow) => {
                    const factory = new StationDatabaseFactory(stationRow, modules, sensors, streams, downloads);
                    const station = factory.create();
                    if (!station.id) throw new Error(`no station id on db station`);
                    if (!station.shouldArchive()) {
                        return Promise.resolve([station]);
                    }
                    console.log(`archiving station: ${JSON.stringify(station)}`);
                    return await db.archiveStation(station.id).then(() => {
                        return [];
                    });
                })
            ).then((all) => {
                return _.flatten(all);
            });
        }
    );
}

type ActionParameters = ActionContext<StationsState, never>;

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.LOAD]: async ({ dispatch }: ActionParameters) => {
            try {
                await dispatch(ActionTypes.LOAD_STATIONS);
            } catch (error) {
                console.log(`error loading firmware:`, error);
            }
        },
        [ActionTypes.LOAD_STATIONS]: async ({ commit, dispatch }: ActionParameters) => {
            await loadStationsFromDatabase(services.db()).then((stations) => {
                commit(MutationTypes.STATIONS, stations);
                return dispatch(ActionTypes.STATIONS_LOADED, stations);
            });
        },
        [ActionTypes.STATION_REPLY]: async ({ dispatch }: ActionParameters, payload: StationRepliedAction) => {
            const statusReply = payload.statusReply;
            if ((statusReply?.errors?.length || 0) > 0) {
                throw new Error(`station error reply`);
            }
            await services
                .db()
                .addOrUpdateStation(makeStationFromStatus(statusReply), payload.url)
                .then(() => dispatch(ActionTypes.LOAD_STATIONS))
                .catch((err: Error) => {
                    console.log(`error handling STATION_REPLY: ${err.message}`, err.stack);
                    console.log(`error handling STATION_REPLY:`, JSON.stringify(statusReply));
                    return Promise.reject(err);
                });

            if (statusReply.logs) {
                await services.db().appendStationLogs(statusReply.status.identity.deviceId, statusReply.logs);
            }
        },
        [ActionTypes.STATION_PORTAL_ERROR]: async ({ commit }: ActionParameters, payload: PortalErrorAction) => {
            await services
                .db()
                .setStationPortalError({ id: payload.id }, payload.error)
                .then((changed) => {
                    if (changed) {
                        commit(MutationTypes.STATION_PORTAL_STATUS, payload);
                    }
                });
        },
        [ActionTypes.STATION_PORTAL_REPLY]: async ({ commit }: ActionParameters, payload: PortalReplyAction) => {
            await services.db().setStationPortalError({ id: payload.id }, NoPortalError);
            const changed = await services.db().setStationPortalId(payload);
            if (changed) {
                commit(MutationTypes.STATION_PORTAL_STATUS, payload);
            }
            await services.db().updateLastSyncedAt(payload.userId);
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: StationsState) => {
        Object.assign(state, new StationsState());
    },
    [MutationTypes.STATIONS]: (state: StationsState, stations: Station[]) => {
        Vue.set(state, "all", stations);
    },
    [MutationTypes.STATION_PORTAL_STATUS]: (state: StationsState, status: StationPortalStatus) => {
        const station = _.first(state.all.filter((s) => s.id == status.id));
        if (!station) throw new Error("missing station");
        station.updatePortalStatus(status);
    },
};

type ModuleType = VuexModule<StationsState, never>;

export const stations = (services: ServiceRef): ModuleType => {
    const state = () => new StationsState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
