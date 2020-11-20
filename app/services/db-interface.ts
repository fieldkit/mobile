import _ from "lodash";
import Config from "@/config";
import Settings from "@/settings";
import { sqliteToJs } from "@/utilities";
import { Database } from "@/wrappers/sqlite";
import { Download, FileTypeUtils, Station, Sensor, Module, Stream } from "@/store/types";
import {
    AccountsTableRow,
    DownloadTableRow,
    NotesTableRow,
    NotificationsTableRow,
    QueriedNotificationsTableRow,
    StationTableRow,
    PortalConfigTableRow,
    FirmwareTableRow,
    StreamTableRow,
    SettingsTableRow,
    SensorTableRow,
    ModuleTableRow,
    StationAddressRow,
    StoreLogRow,
} from "@/store/row-types";
import { Services } from "@/services";
import { Notification } from "~/store/modules/notifications";

const log = Config.logger("DbInterface");

export interface UserAccount {
    name: string;
    email: string;
    portalId: number;
    token: string;
    usedAt: Date | null;
}

export default class DatabaseInterface {
    constructor(private readonly services: Services) {}

    private getDatabase(): Promise<Database> {
        return this.services.CreateDb().getDatabase();
    }

    private async query<T>(sql: string, args: unknown[] | undefined = undefined): Promise<T[]> {
        const db = await this.getDatabase();
        const raw = await db.query(sql, args);
        return sqliteToJs<T>(raw);
    }

    private async execute(sql: string, args: unknown[] | undefined = undefined): Promise<void> {
        const db = await this.getDatabase();
        await db.execute(sql, args);
    }

    public getAll(): Promise<StationTableRow[]> {
        return this.query<StationTableRow>("SELECT * FROM stations WHERE archived IS NULL OR archived = 0");
    }

    public getModuleAll(): Promise<ModuleTableRow[]> {
        return this.query<ModuleTableRow>("SELECT * FROM modules ORDER BY station_id");
    }

    public getSensorAll(): Promise<SensorTableRow[]> {
        return this.query<SensorTableRow>("SELECT * FROM sensors ORDER BY module_id");
    }

    public getStreamAll(): Promise<StreamTableRow[]> {
        return this.query<StreamTableRow>("SELECT * FROM streams ORDER BY station_id");
    }

    public getDownloadAll(): Promise<DownloadTableRow[]> {
        return this.query<DownloadTableRow>("SELECT * FROM downloads ORDER BY station_id");
    }

    public getAvailablePortalEnvs(): Promise<PortalConfigTableRow[]> {
        return this.query<PortalConfigTableRow>("SELECT * FROM config");
    }

    public removeNullIdModules(): Promise<void> {
        return this.execute("DELETE FROM modules WHERE device_id IS NULL");
    }

    public async updatePortalEnv(row: PortalConfigTableRow): Promise<void> {
        await this.getAvailablePortalEnvs().then((envs) => {
            const addRow = (): Promise<void> => {
                return this.execute("INSERT INTO config (base_uri, ingestion_uri) VALUES (?, ?)", [row.baseUri, row.ingestionUri]);
            };

            if (envs.length > 1) {
                return this.execute("DELETE FROM config").then(() => {
                    return addRow();
                });
            }
            if (envs.length == 0) {
                return addRow();
            }
            return this.execute("UPDATE config SET base_uri = ?, ingestion_uri = ?", [row.baseUri, row.ingestionUri]);
        });
    }

    public async setStationPortalId(station: { id: number; portalId: number }): Promise<boolean> {
        if (!station.portalId) {
            console.log(`no portal id`);
            throw new Error(`no portal id`);
        }

        try {
            const rows = await this.query<{ portalId: number | null }>("SELECT portal_id FROM stations WHERE id = ?", [station.id]);
            if (rows.length == 0) throw new Error(`setting portal-id for unknown station`);
            const existing = rows[0].portalId;
            if (existing == station.portalId) {
                return false;
            }

            console.log("changed!", existing, station.portalId);
            await this.updateStationPortalId(station.id, station.portalId);
            return true;
        } catch (error) {
            console.log(`error setting portal id`, error);
            throw new Error(`error setting portal id: ${JSON.stringify(error)}`);
        }
    }

    private async updateStationPortalId(stationId: number, portalId: number): Promise<void> {
        const values = [portalId, new Date(), stationId];
        await this.execute("UPDATE stations SET portal_id = ?, updated = ? WHERE id = ?", values);
    }

    // {"id":3,"error":{"name":"station-owner-conflict","id":"7KE71s8T","message":"station already registered","temporary":false,"timeout":false,"fault":false}}
    private samePortalError(db: string | null, saving: Record<string, unknown> | null): boolean {
        if (db == null && saving == null) return true;
        if (db == null || saving == null) return false;
        try {
            const parsed = JSON.parse(db) as Record<string, unknown>;
            if (parsed["name"] == saving["name"]) {
                return true;
            }
        } catch (error) {
            console.log(`error parsing portal error '${db}':`, error);
        }
        return false;
    }

    public async setStationPortalError(station: { id: number }, error: Record<string, unknown> | null): Promise<boolean> {
        try {
            const rows = await this.query<{ portalHttpError: string | null }>("SELECT portal_http_error FROM stations WHERE id = ?", [
                station.id,
            ]);
            if (rows.length == 0) throw new Error(`setting portal-error for unknown station`);
            if (this.samePortalError(rows[0].portalHttpError, error)) {
                return false;
            }

            await this.updateStationPortalError(station.id, error);
            return true;
        } catch (error) {
            console.log(`error setting portal error:`, error);
            throw new Error(`error setting portal error ${JSON.stringify(error)}`);
        }
    }

    private async updateStationPortalError(stationId: number, error: Record<string, unknown> | null): Promise<void> {
        const values = [error ? "{}" : JSON.stringify(error), new Date(), new Date(), stationId];
        await this.execute("UPDATE stations SET portal_http_error = ?, portal_updated = ?, updated = ? WHERE id = ?", values);
    }

    private async updateStation(station: Station): Promise<void> {
        if (!station.id) new Error(`no station id in update station`);

        // For the time being, need to not update the fields that are being set individually,
        // as they get overwritten with null if we do. Those include:
        // station.locationName,
        // station.studyObjective,
        // station.locationPurpose,
        // station.siteCriteria,
        // station.siteDescription,
        // station.percentComplete,

        const values = [
            false, // TODO remove station.connected,
            station.generationId,
            station.name,
            station.archived ? 1 : 0,
            "", // TODO remove URL
            station.portalId,
            "", // TODO remove status
            station.deployStartTime,
            station.batteryLevel,
            station.consumedMemory,
            station.totalMemory,
            0, // TODO remove consumedMemoryPercent
            JSON.stringify(station.schedules),
            "", // TODO remove JSON.stringify(station.statusJson),
            station.longitude,
            station.latitude,
            station.serializedStatus,
            new Date(),
            station.lastSeen,
            station.id,
        ];
        await this.execute(
            `UPDATE stations SET connected = ?, generation_id = ?, name = ?, archived = ?, url = ?, portal_id = ?, status = ?,
			deploy_start_time = ?, battery_level = ?, consumed_memory = ?, total_memory = ?, consumed_memory_percent = ?,
			schedules = ?, status_json = ?, longitude = ?, latitude = ?, serialized_status = ?, updated = ?, last_seen = ?
			WHERE id = ?`,
            values
        );
    }

    private getModulePrimaryKey(deviceId: string): Promise<number> {
        if (_.isString(deviceId)) {
            return this.query<{ id: number }>("SELECT id FROM modules WHERE device_id = ? OR module_id = ? ORDER BY id DESC", [
                deviceId,
            ]).then((rows: { id: number }[]) => {
                if (rows.length == 0) {
                    return Promise.reject(new Error(`no such module: ${deviceId} ${rows.length}`));
                }
                const keeping = rows[0];
                if (rows.length > 1) {
                    console.log(`deleting duplicate modules ${deviceId} ${rows.length}`);
                    return this.execute("DELETE FROM sensors WHERE module_id IN (SELECT id FROM modules WHERE device_id = ? AND id != ?)", [
                        deviceId,
                        keeping,
                    ]).then(() => {
                        return this.execute("DELETE FROM modules WHERE device_id = ? AND id != ?", [deviceId, keeping]).then(() => {
                            return keeping.id;
                        });
                    });
                }
                return keeping.id;
            });
        }
        return Promise.resolve(deviceId);
    }

    public async archiveStation(id: number): Promise<void> {
        await this.execute("UPDATE stations SET archived = 1 WHERE id IN (?)", [id]);
    }

    private async insertSensor(moduleId: string, sensor: Sensor): Promise<void> {
        await this.getModulePrimaryKey(moduleId).then((modulePrimaryKey) =>
            this.execute("INSERT INTO sensors (module_id, name, unit, frequency, current_reading) VALUES (?, ?, ?, ?, ?)", [
                modulePrimaryKey,
                sensor.name,
                sensor.unitOfMeasure,
                0,
                sensor.reading,
            ]).catch((error) => Promise.reject(new Error(`error inserting sensor: ${JSON.stringify(error)}`)))
        );
    }

    private async insertModule(stationId: number, module: Module): Promise<void> {
        // Note: device_id is the module's unique hardware id (not the station's)
        if (!module.moduleId) throw new Error(`module id is required`);
        const values = [
            module.moduleId,
            module.moduleId,
            module.name,
            0,
            module.position,
            stationId,
            module.flags || 0,
            module.status ? JSON.stringify(module.status) : "",
        ];
        await this.execute(
            "INSERT INTO modules (module_id, device_id, name, interval, position, station_id, flags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            values
        ).catch((error) => {
            console.log(`error inserting module: ${JSON.stringify(error)}`);
            console.log(`error inserting values: ${JSON.stringify({ values: values })}`);
            return Promise.reject(new Error(`error inserting module: ${JSON.stringify(error)}`));
        });
    }

    private synchronizeSensors(_moduleId: string, module: Module, sensorRows: SensorTableRow[]): Promise<void> {
        // TODO: include position?
        const incoming = _.keyBy(module.sensors, (s) => s.name);
        const existing = _.keyBy(sensorRows, (s) => s.name);
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.verbose("synchronize sensors", adding, removed, keeping);

        function getTrend(name: string): number {
            if (!existing[name] || !incoming[name] || !existing[name].currentReading || !incoming[name].reading) {
                return 0;
            }
            // eslint-disable-next-line
            const previous = Math.round((existing[name]!.currentReading || 0) * 10) / 10;
            // eslint-disable-next-line
            const current = Math.round((incoming[name]!.reading || 0) * 10) / 10;
            return current == previous ? 0 : current > previous ? 1 : -1;
        }

        return Promise.all([
            Promise.all(adding.map((name) => this.insertSensor(module.moduleId, incoming[name]))),
            Promise.all(removed.map((name) => this.execute("DELETE FROM sensors WHERE id = ?", [existing[name].id]))),
            Promise.all(
                keeping
                    .map((name) => {
                        return {
                            id: existing[name].id,
                            reading: incoming[name].reading,
                            trend: getTrend(name),
                        };
                    })
                    .filter((update) => update.reading != null)
                    .map((update) =>
                        this.execute("UPDATE sensors SET current_reading = ?, trend = ? WHERE id = ?", [
                            update.reading,
                            update.trend,
                            update.id,
                        ])
                    )
            ),
        ]).then(() => Promise.resolve());
    }

    private synchronizeModules(
        stationId: number,
        station: Station,
        moduleRows: ModuleTableRow[],
        sensorRows: SensorTableRow[]
    ): Promise<void> {
        const incoming = _.keyBy(station.modules, (m) => m.moduleId);
        const existing = _.keyBy(moduleRows, (m) => m.moduleId);
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.info("synchronize modules", stationId, adding, removed, keeping);

        return Promise.all([
            Promise.all(
                adding.map((moduleId) =>
                    this.insertModule(stationId, incoming[moduleId]).then(() => this.synchronizeSensors(moduleId, incoming[moduleId], []))
                )
            ),
            Promise.all(
                removed.map((moduleId) =>
                    this.execute("DELETE FROM sensors WHERE module_id = ?", [existing[moduleId].id]).then(() =>
                        this.execute("DELETE FROM modules WHERE id = ?", [existing[moduleId].id])
                    )
                )
            ),
            Promise.all(
                keeping.map((moduleId) => {
                    const status = incoming[moduleId].status ? JSON.stringify(incoming[moduleId].status) : "";
                    const values = [incoming[moduleId].flags || 0, status, existing[moduleId].id];
                    return this.execute("UPDATE modules SET flags = ?, status = ? WHERE id = ?", values).then(() => {
                        const moduleSensorRows = sensorRows.filter((r) => r.moduleId == existing[moduleId].id);
                        return this.synchronizeSensors(moduleId, incoming[moduleId], moduleSensorRows);
                    });
                })
            ),
        ]).then(() => Promise.resolve());
    }

    private async insertStream(stationId: number, stream: Stream): Promise<void> {
        // NOTE We're always created for the first time from a status
        // reply and these are the values we're guaranteed to get from
        // those, to avoid inserting NULLs, which the Android SQLITE
        // library seems to handle poorly?!
        const values = [
            stationId,
            stream.deviceId,
            stream.generationId,
            stream.type,
            stream.deviceSize,
            stream.deviceFirstBlock,
            stream.deviceLastBlock,
            new Date(),
        ];
        await this.execute(
            `INSERT INTO streams (station_id, device_id, generation_id, type, device_size, device_first_block, device_last_block, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            values
        );
    }

    public async forgetUploads(): Promise<void> {
        await this.execute("UPDATE streams SET portal_size = NULL, portal_first_block = NULL, portal_last_block = NULL");
    }

    public async forgetDownloads(): Promise<void> {
        await this.execute("DELETE FROM streams");
    }

    private updateStream(streamId: number, generationId: string, stream: Stream): Promise<void> {
        const updates: Promise<void>[] = [];

        if (stream.deviceSize !== null && stream.deviceFirstBlock !== null && stream.deviceLastBlock !== null) {
            const values = [stream.deviceSize, stream.deviceFirstBlock, stream.deviceLastBlock, stream.updated, generationId, streamId];
            console.log(`updating stream: device`, values);
            updates.push(
                this.execute(
                    `UPDATE streams SET device_size = ?, device_first_block = ?, device_last_block = ?, updated = ?, generation_id = ? WHERE id = ?`,
                    values
                )
            );
        }

        if (stream.downloadSize !== null && stream.downloadFirstBlock !== null && stream.downloadLastBlock !== null) {
            const values = [
                stream.downloadSize,
                stream.downloadFirstBlock,
                stream.downloadLastBlock,
                stream.updated,
                generationId,
                streamId,
            ];
            console.log(`updating stream: download`, values);
            updates.push(
                this.execute(
                    `UPDATE streams SET download_size = ?, download_first_block = ?, download_last_block = ?, updated = ?, generation_id = ? WHERE id = ?`,
                    values
                )
            );
        }

        if (stream.portalSize !== null && stream.portalFirstBlock !== null && stream.portalLastBlock !== null) {
            const values = [stream.portalSize, stream.portalFirstBlock, stream.portalLastBlock, stream.updated, generationId, streamId];
            console.log(`updating stream: portal`, values);
            updates.push(
                this.execute(
                    `UPDATE streams SET portal_size = ?, portal_first_block = ?, portal_last_block = ?, updated = ?, generation_id = ? WHERE id = ?`,
                    values
                )
            );
        }

        return Promise.all(updates).then(() => Promise.resolve());
    }

    private synchronizeStreams(stationId: number, station: Station, streamRows: StreamTableRow[]): Promise<void> {
        const incoming = _.keyBy(station.streams, (m) => m.type);
        const existing = _.keyBy(streamRows, (m) => m.type);
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.verbose("synchronize streams", stationId, adding, removed, keeping);

        return Promise.all([
            Promise.all(adding.map((name) => this.insertStream(stationId, incoming[name]))),
            Promise.all(removed.map((name) => this.query("DELETE FROM streams WHERE id = ?", [existing[name].id]))),
            Promise.all(
                keeping.map((name) =>
                    this.updateStream(existing[name].id, station.generationId, incoming[name].keepingFrom(existing[name]))
                )
            ),
        ]).then(() => Promise.resolve());
    }

    private async insertStation(newStation: Station): Promise<void> {
        await this.execute(
            `
					INSERT INTO stations (device_id,
						generation_id, name, archived, url, status,
						deploy_start_time, battery_level, consumed_memory, total_memory,
						consumed_memory_percent, schedules, status_json,
						longitude, latitude, serialized_status, updated, last_seen)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newStation.deviceId,
                newStation.generationId,
                newStation.name,
                newStation.archived,
                "", // TODO remove newStatus.url,
                "", // TODO remove newStation.status,
                newStation.deployStartTime,
                newStation.batteryLevel,
                newStation.consumedMemory,
                newStation.totalMemory,
                0, // TODO remove newStation.consumedMemoryPercent,
                JSON.stringify(newStation.schedules),
                "", // TODO remove JSON.stringify(statusJson),
                newStation.longitude,
                newStation.latitude,
                newStation.serializedStatus,
                new Date(),
                newStation.lastSeen,
            ]
        ).catch((error) => Promise.reject(new Error(`error inserting station: ${JSON.stringify(error)}`)));
    }

    public async addOrUpdateStation(station: Station, url: string): Promise<void> {
        return this.getStationIdByDeviceId(station.deviceId)
            .then((id: number | null) => {
                if (id === null) {
                    return this.insertStation(station);
                }
                return this.updateStation(_.merge({}, station, { id: id }));
            })
            .then(() => this.getStationIdByDeviceId(station.deviceId))
            .then((stationId) => {
                if (!stationId) throw new Error(`serious error adding station`);
                return this.updateStationAddress(stationId, url).then(() => {
                    return stationId;
                });
            })
            .then((stationId) => {
                return Promise.all([
                    // Query for all modules, they have globally
                    // unique identifiers and can move around. We may need to eventually optimize.
                    this.query<ModuleTableRow>("SELECT * FROM modules"),
                    this.query<SensorTableRow>("SELECT * FROM sensors WHERE module_id IN (SELECT id FROM modules WHERE station_id = ?)", [
                        stationId,
                    ]),
                    this.query<StreamTableRow>("SELECT * FROM streams WHERE station_id = ? AND generation_id = ?", [
                        stationId,
                        station.generationId,
                    ]),
                ]).then((all) => {
                    const moduleRows: ModuleTableRow[] = all[0];
                    const sensorRows: SensorTableRow[] = all[1];
                    const streamRows: StreamTableRow[] = all[2];
                    return this.synchronizeModules(stationId, station, moduleRows, sensorRows).then(() => {
                        return this.synchronizeStreams(stationId, station, streamRows);
                    });
                });
            });
    }

    private async updateStationAddress(stationId: number, url: string): Promise<void> {
        await this.query<StationAddressRow>("SELECT * FROM station_addresses WHERE station_id = ?", [stationId]).then(
            (existing: StationAddressRow[]) => {
                const byUrl = _.keyBy(existing, (e) => e.url);
                if (byUrl[url]) {
                    const id = byUrl[url].id;
                    return this.execute("UPDATE station_addresses SET url = ?, time = ? WHERE id = ?", [url, new Date(), id]);
                } else {
                    return this.execute("INSERT INTO station_addresses (station_id, time, url) VALUES (?, ?, ?)", [
                        stationId,
                        new Date(),
                        url,
                    ]);
                }
            }
        );
    }

    public queryRecentlyActiveAddresses(): Promise<StationAddressRow[]> {
        return this.query<StationAddressRow>(
            "SELECT sa.url, s.device_id, time FROM station_addresses AS sa JOIN stations AS s ON (sa.station_id = s.id) ORDER BY sa.time DESC"
        );
    }

    public insertDownload(download: DownloadTableRow): Promise<void> {
        const values = [
            download.stationId,
            download.deviceId,
            download.generation,
            download.path,
            download.type,
            download.timestamp,
            download.url,
            download.size,
            download.blocks,
            download.firstBlock,
            download.lastBlock,
        ];
        console.log(`inserting download`, values);
        return this.execute(
            `INSERT INTO downloads (station_id, device_id, generation, path, type, timestamp, url, size, blocks, first_block, last_block)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values
        )
            .then(() => {
                const updating = [
                    download.size,
                    download.firstBlock,
                    download.lastBlock,
                    download.lastBlock,
                    download.stationId,
                    download.type,
                ];
                console.log(`updating streams:`, updating);
                return this.execute(
                    `UPDATE streams SET download_size = COALESCE(download_size, 0) + ?,
							                download_first_block = MIN(COALESCE(download_first_block, 0xffffffff), ?),
							                download_last_block = MAX(COALESCE(download_last_block, 0), ?),
							                device_last_block = MAX(COALESCE(device_last_block, 0), ?)
						 WHERE station_id = ? AND type = ?`,
                    updating
                );
            })
            .catch((error) => Promise.reject(new Error(`error inserting download: ${JSON.stringify(error)}`)));
    }

    public markDownloadAsUploaded(download: Download): Promise<void> {
        if (download.stationId === null || download.fileType === null) {
            console.log("malformed download row", download.stationId, download.fileType, download);
            throw new Error("malformed download row");
        }
        return this.query("UPDATE downloads SET uploaded = ? WHERE id = ?", [new Date(), download.id]).then(() => {
            const values = [
                download.size,
                download.firstBlock,
                download.lastBlock,
                download.stationId,
                FileTypeUtils.toString(download.fileType),
            ];
            console.log(`mark as download updating streams:`, values);
            return this.execute(
                `UPDATE streams SET portal_size = COALESCE(portal_size, 0) + ?,
						            portal_first_block = MIN(COALESCE(portal_first_block, 0xffffffff), ?),
						            portal_last_block = MAX(COALESCE(portal_last_block, 0), ?)
				 WHERE station_id = ? AND type = ?`,
                values
            );
        });
    }

    private getStationIdByDeviceId(deviceId: string): Promise<number | null> {
        if (!deviceId) {
            return Promise.reject(new Error(`invalid device id`));
        }
        return this.query<{ id: number }>("SELECT id FROM stations WHERE device_id = ?", [deviceId]).then((rows) => {
            if (rows.length != 1) {
                return null;
            }
            return rows[0].id;
        });
    }

    // Firwmare

    public getAllFirmware(): Promise<FirmwareTableRow[]> {
        return this.query<FirmwareTableRow>("SELECT * FROM firmware ORDER BY time DESC");
    }

    public getLatestFirmware(): Promise<FirmwareTableRow | null> {
        return this.query<FirmwareTableRow>("SELECT * FROM firmware ORDER BY time DESC LIMIT 1").then((all) => {
            if (all.length == 0) {
                return null;
            }
            return all[0];
        });
    }

    public deleteAllFirmwareExceptIds(ids: number[]): Promise<FirmwareTableRow[]> {
        const values = _.range(ids.length)
            .map(() => "?")
            .join(",");

        return this.query<FirmwareTableRow>("SELECT * FROM firmware WHERE id NOT IN (" + values + ")", ids).then((data) => {
            return this.execute("DELETE FROM firmware WHERE id NOT IN (" + values + ")", ids).then(() => {
                return data;
            });
        });
    }

    public addOrUpdateFirmware(firmware: FirmwareTableRow): Promise<void> {
        return this.query("SELECT id FROM firmware WHERE id = ?", [firmware.id]).then((id) => {
            if (id.length === 1) {
                return Promise.resolve();
            }
            const values = [
                firmware.id,
                firmware.time,
                firmware.url,
                firmware.module,
                firmware.profile,
                firmware.etag,
                firmware.path,
                _.isObject(firmware.meta) ? JSON.stringify(firmware.meta) : firmware.meta,
                firmware.buildTime,
                firmware.buildNumber,
            ];
            return this.execute(
                `INSERT INTO firmware (id, time, url, module, profile, etag, path, meta, build_time, build_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                values
            );
        });
    }

    public async addOrUpdateNotes(notes: { stationId: number }): Promise<void> {
        function serializeNotesJson(notes): string {
            try {
                return JSON.stringify(notes);
            } catch (error) {
                log.error(`error serializing notes json: ${JSON.stringify(error)}`);
                throw new Error(`error serializing notes json: ${JSON.stringify(error)}`);
            }
        }

        await this.query(`SELECT id FROM notes WHERE station_id = ?`, [notes.stationId])
            .then((maybeId: { id: number }[]) => {
                const json = serializeNotesJson(notes);
                if (maybeId.length == 0) {
                    const values = [notes.stationId, new Date(), new Date(), json];
                    return this.execute(`INSERT INTO notes (station_id, created_at, updated_at, notes) VALUES (?, ?, ?, ?)`, values);
                }
                const values = [new Date(), json, maybeId[0].id];
                return this.execute(`UPDATE notes SET updated_at = ?, notes = ? WHERE id = ?`, values);
            })
            .catch((error) => Promise.reject(new Error(`error fetching notes: ${JSON.stringify(error)}`)));
    }

    public getAllNotes(): Promise<NotesTableRow[]> {
        return this.query<NotesTableRow>("SELECT * FROM notes")
            .then((rows) =>
                rows.map((row) => {
                    try {
                        row.notesObject = JSON.parse(row.notes) as Record<string, unknown>;
                        return row;
                    } catch (error) {
                        log.error(`error deserializing notes JSON: ${JSON.stringify(error)}`);
                        log.error(`JSON: ${JSON.stringify(row.notes)}`);
                    }
                    return row;
                })
            )
            .catch((error) => Promise.reject(new Error(`error fetching notes: ${JSON.stringify(error)}`)));
    }

    public checkSettings(): Promise<void> {
        return this.getSettings().then((rows) => {
            if (rows.length == 0) {
                console.log("settings: initializing");
                return this.insertSettings(Settings);
            } else {
                console.log("existing settings: ", rows[0]);
                return;
            }
        });
    }

    public getSettings(): Promise<SettingsTableRow[]> {
        return this.query<SettingsTableRow>("SELECT * FROM settings LIMIT 1")
            .then((rows) =>
                rows.map((row) => {
                    try {
                        row.settingsObject = JSON.parse(row.settings) as Record<string, unknown>;
                        return row;
                    } catch (error) {
                        log.error(`error deserializing notes JSON: ${JSON.stringify(error)}`);
                        log.error(`JSON: ${JSON.stringify(row.settings)}`);
                    }
                    return row;
                })
            )
            .catch((error) => Promise.reject(new Error(`error fetching settings: ${JSON.stringify(error)}`)));
    }

    public async insertSettings(settings: Record<string, unknown>): Promise<void> {
        return await this.execute("INSERT INTO settings (created_at, updated_at,settings) VALUES (?, ?, ?)", [
            new Date(),
            new Date(),
            JSON.stringify(settings),
        ]).catch((error) => {
            console.log(`error inserting settings: ${JSON.stringify(error)}`);
            throw new Error(`error inserting settings: ${JSON.stringify(error)}`);
        });
    }

    public async updateSettings(settings: Record<string, unknown>): Promise<void> {
        return await this.execute("UPDATE settings SET settings = ?", [JSON.stringify(settings)]).catch((error) => {
            console.log(`error updating settings: ${JSON.stringify(error)}`);
            throw new Error(`error updating settings: ${JSON.stringify(error)}`);
        });
    }

    public async getAllAccounts(): Promise<AccountsTableRow[]> {
        return await this.query<AccountsTableRow>("SELECT * FROM accounts").catch((error) =>
            Promise.reject(new Error(`error fetching accounts: ${JSON.stringify(error)}`))
        );
    }

    public async addOrUpdateAccounts(account: UserAccount): Promise<void> {
        return await this.query(`SELECT id FROM accounts WHERE email = ?`, [account.email])
            .then((maybeId: { id: number }[]) => {
                if (maybeId.length == 0) {
                    const values = [account.name, account.email, account.portalId, account.token, new Date()];
                    return this.execute(`INSERT INTO accounts (name, email, portal_id, token, used_at) VALUES (?, ?, ?, ?, ?)`, values);
                }
                const values = [account.name, account.email, account.portalId, account.token, new Date(), maybeId[0].id];
                return this.execute(`UPDATE accounts SET name = ?, email = ?, portal_id = ?, token = ?, used_at = ? WHERE id = ?`, values);
            })
            .then(() => Promise.resolve())
            .catch((error) => Promise.reject(new Error(`error fetching accounts: ${JSON.stringify(error)}`)));
    }

    public async deleteAllAccounts(): Promise<void> {
        await this.execute(`DELETE FROM accounts`);
    }

    public async getAllNotifications(): Promise<QueriedNotificationsTableRow[]> {
        return await this.query<NotificationsTableRow>("SELECT * FROM notifications")
            .then((rows) =>
                rows.map((row) => {
                    try {
                        return {
                            id: row.id,
                            key: row.key,
                            kind: row.kind,
                            created: row.created,
                            silenced: row.silenced,
                            dismissed_at: row.dismissed_at,
                            satisfied_at: row.satisfied_at,
                            actions: row.actions,
                            project: JSON.parse(row.project) as Record<string, unknown>,
                            user: JSON.parse(row.user) as Record<string, unknown>,
                            station: JSON.parse(row.station) as Record<string, unknown>,
                        };
                    } catch (error) {
                        log.error(`error deserializing notifications JSON: ${JSON.stringify(error)}`);
                        log.error(`JSON: ${JSON.stringify(row)}`);
                        throw error;
                    }
                })
            )
            .catch((error) => Promise.reject(new Error(`error fetching notifications: ${JSON.stringify(error)}`)));
    }

    public async addNotification(notification: Notification): Promise<void> {
        console.log("addNotifications", notification);
        await this.query<{ id: number }>(`SELECT id FROM notifications WHERE key = ?`, [notification.key])
            .then((maybeId) => {
                if (maybeId.length == 0) {
                    const values = [
                        notification.key,
                        notification.kind,
                        Number(new Date()),
                        notification.silenced,
                        JSON.stringify(notification.project),
                        JSON.stringify(notification.user),
                        JSON.stringify(notification.station),
                        notification.actions,
                    ];
                    return this.execute(
                        `INSERT INTO notifications (key, kind, created, silenced, project, user, station, actions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        values
                    );
                }
                return;
            })
            .catch((error) => Promise.reject(new Error(`error adding notifications: ${JSON.stringify(error)}`)));
    }

    public async updateNotification(notification: Notification): Promise<void> {
        console.log("updateNotification", notification);
        await this.query<NotificationsTableRow>(`SELECT * FROM notifications WHERE key = ?`, [notification.key])
            .then((maybe) => {
                if (maybe.length > 0) {
                    const dbValues = maybe[0];
                    const values = [
                        notification.key ?? dbValues.key,
                        notification.kind ?? dbValues.kind,
                        notification.silenced === true ? "true" : "false",
                        notification.dismissed_at ?? dbValues.dismissed_at,
                        notification.satisfied_at ?? dbValues.satisfied_at,
                        notification.project ? JSON.stringify(notification.project) : dbValues.project,
                        notification.user ? JSON.stringify(notification.user) : dbValues.user,
                        notification.station ? JSON.stringify(notification.station) : dbValues.station,
                        notification.actions ?? dbValues.actions,
                        notification.id,
                    ];

                    return this.execute(
                        `UPDATE notifications SET key = ?, kind = ?, silenced = ?, dismissed_at = ?, satisfied_at = ?, project = ?, user = ?, station = ?, actions = ? WHERE id = ?`,
                        values
                    );
                }

                return;
            })
            .catch((error) => Promise.reject(new Error(`error updating notifications: ${JSON.stringify(error)}`)));
    }

    public async addStoreLog(row: StoreLogRow): Promise<void> {
        try {
            const values = [row.time, row.mutation, row.payload, row.before, row.after];
            await this.execute("INSERT INTO store_log (time, mutation, payload, before, after) VALUES (?, ?, ?, ?, ?)", values);
        } catch (error) {
            console.log(`add-store-log error`, error);
        }
    }

    public async purgeOldLogs(): Promise<void> {
        const now = new Date();
        const epoch = now.getTime() - 1 * 60 * 1000;
        const values = [epoch];

        const before = await this.query<{ nlogs: number }>("SELECT COUNT(*) AS nlogs FROM store_log");
        console.log(`database-logs before ${JSON.stringify(before)}`);

        await this.execute("DELETE FROM store_log WHERE time < ?", values);

        const after = await this.query<{ nlogs: number }>("SELECT COUNT(*) AS nlogs FROM store_log");
        console.log(`database-logs after ${JSON.stringify(after)}`);

        await this.execute("VACUUM");

        console.log(`database-logs ready`);
    }
}
