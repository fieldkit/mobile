import _ from "lodash";
import Config from "@/config";
import Settings from "@/settings";
import { promiseAfter, sqliteToJs } from "@/lib";
import { Database } from "@/wrappers/sqlite";
import { Download, FileType, FileTypeUtils, Station, Sensor, Module, Stream, StoredNetworkTableRow } from "@/store/types";
import { NoteMedia } from "@/store/mutations";
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
import { Notes } from "@/store/modules/notes";

const log = Config.logger("db");

export default class DatabaseInterface {
    constructor(private readonly services: Services) {}

    private getDatabase(): Promise<Database> {
        return this.services.CreateDb().getDatabase();
    }

    public async startup(): Promise<void> {
        await this.checkSettings();
        await this.cleanup();

        void promiseAfter(60000).then(() => {
            void this.startup();
        });
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
        return this.query<ModuleTableRow>("SELECT * FROM modules ORDER BY station_id, position");
    }

    public getSensorAll(): Promise<SensorTableRow[]> {
        return this.query<SensorTableRow>("SELECT * FROM sensors ORDER BY module_id, position");
    }

    public getStreamAll(): Promise<StreamTableRow[]> {
        return this.query<StreamTableRow>("SELECT * FROM streams ORDER BY station_id");
    }

    public getDownloadAll(): Promise<DownloadTableRow[]> {
        return this.query<DownloadTableRow>("SELECT * FROM downloads ORDER BY station_id");
    }

    public getPendingStationDownloads(deviceId: string): Promise<DownloadTableRow[]> {
        return this.query<DownloadTableRow>("SELECT * FROM downloads WHERE device_id = ? AND uploaded IS NULL", [deviceId]);
    }

    public getStationGenerationDownloads(_deviceId: string, generationId: string): Promise<DownloadTableRow[]> {
        return this.query<DownloadTableRow>("SELECT * FROM downloads WHERE generation = ?", [generationId]);
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

    public async setStationPortalId(station: { id: number; portalId: number; ownerId: number }): Promise<boolean> {
        if (!station.portalId) {
            log.error(`no portal id`);
            throw new Error(`no portal id`);
        }

        if (!station.ownerId) {
            log.error(`no owner id`);
            throw new Error(`no owner id`);
        }

        try {
            const rows = await this.query<{ portalId: number | null; userId: number | null }>(
                "SELECT portal_id, user_id FROM stations WHERE id = ?",
                [station.id]
            );
            if (rows.length == 0) throw new Error(`setting portal-id for unknown station`);
            const existing = rows[0];
            if (existing.portalId == station.portalId && existing.userId == station.ownerId) {
                log.verbose(`reply-same: ${JSON.stringify({ existing, station })}`);
                return false;
            }

            log.info(`reply-changed: ${JSON.stringify({ existing, station })}`);
            await this.updateStationPortalId(station.id, station.portalId, station.ownerId);
            return true;
        } catch (error) {
            log.error(`error setting portal id`, error);
            throw new Error(`error setting portal id: ${JSON.stringify(error)}`);
        }
    }

    public async updateLastSyncedAt(userId: number): Promise<void> {
        try {
            const values = [new Date(), userId];
            await this.execute("UPDATE accounts SET last_synced = ? WHERE portal_id = ?", values);
        } catch (error) {
            log.error(`error updating last synced`, error);
            throw new Error(`error updating last synced: ${JSON.stringify(error)}`);
        }
    }

    private async updateStationPortalId(stationId: number, portalId: number, userId: number): Promise<void> {
        if (!userId) throw new Error(`invalid operation`);
        if (!portalId) throw new Error(`invalid operation`);
        const values = [portalId, userId, new Date(), stationId];
        await this.execute("UPDATE stations SET portal_id = ?, user_id = ?, updated = ? WHERE id = ?", values);
    }

    // {"id":3,"error":{"name":"station-owner-conflict","id":"7KE71s8T","message":"station already registered","temporary":false,"timeout":false,"fault":false}}
    private samePortalError(db: string | null, saving: Record<string, unknown> | null): boolean {
        if (db == null && saving == null) return true;
        if (db == null || saving == null) return false;
        if (_.isEmpty(db) && _.isEmpty(saving)) return true;
        // Wish this wasn't necessary, but the above wasn't catching
        // some strange objects I was getting back.
        if (JSON.stringify(db) == JSON.stringify(saving)) return true;

        try {
            const parsed = JSON.parse(db) as Record<string, unknown>;
            if (parsed["name"] == saving["name"] && parsed["name"] && saving["name"]) {
                log.verbose(`same-error: ${JSON.stringify({ db, saving })}`);
                log.verbose(`same-error: ${JSON.stringify({ existing: parsed["name"], saving: saving["name"] })}`);
                return true;
            }
        } catch (error) {
            log.info(`error parsing portal error '${db}':`, error);
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
                log.verbose(`error-same: ${JSON.stringify({ existing: rows[0].portalHttpError, updating: error })}`);
                return false;
            }

            log.info(`error-change: ${JSON.stringify({ existing: rows[0].portalHttpError, updating: error })}`);
            await this.updateStationPortalError(station.id, error);
            return true;
        } catch (error) {
            log.error(`error setting portal error:`, error);
            throw new Error(`error setting portal error ${JSON.stringify(error)}`);
        }
    }

    private async updateStationPortalError(stationId: number, error: Record<string, unknown> | null): Promise<void> {
        const values = [error ? JSON.stringify(error) : null, new Date(), new Date(), stationId];
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
                    log.info(`deleting duplicate modules ${deviceId} ${rows.length}`);
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
        await this.getModulePrimaryKey(moduleId).then((modulePrimaryKey) => {
            const values = [modulePrimaryKey, sensor.name, sensor.position, sensor.unitOfMeasure, 0, sensor.reading, sensor.uncalibrated];
            return this.execute(
                "INSERT INTO sensors (module_id, name, position, unit, frequency, reading, uncalibrated) VALUES (?, ?, ?, ?, ?, ?, ?)",
                values
            ).catch((error) => Promise.reject(new Error(`error inserting sensor: ${JSON.stringify(error)}`)));
        });
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
            module.configuration ? JSON.stringify(module.configuration) : "",
        ];

        await this.execute(
            "INSERT INTO modules (module_id, device_id, name, interval, position, station_id, flags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            values
        ).catch((error) => {
            log.error(`error inserting module: ${JSON.stringify(error)}`);
            log.error(`error inserting values: ${JSON.stringify({ values: values })}`);
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
            if (!existing[name] || !incoming[name] || !existing[name].reading || !incoming[name].reading) {
                return 0;
            }
            // eslint-disable-next-line
            const previous = Math.round((existing[name]!.reading || 0) * 10) / 10;
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
                            uncalibrated: incoming[name].uncalibrated,
                            unitOfMeasure: incoming[name].unitOfMeasure,
                            position: incoming[name].position,
                            trend: getTrend(name),
                        };
                    })
                    .filter((update) => update.reading != null)
                    .map((update) =>
                        this.execute("UPDATE sensors SET reading = ?, uncalibrated = ?, trend = ?, position = ?, unit = ? WHERE id = ?", [
                            update.reading,
                            update.uncalibrated,
                            update.trend,
                            update.position,
                            update.unitOfMeasure,
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
        const allExisting = _.keyBy(moduleRows, (m) => m.moduleId);
        const stationModuleRows = moduleRows.filter((m) => m.stationId == stationId);
        const stationExisting = _.keyBy(stationModuleRows, (m) => m.moduleId);

        const incoming = _.keyBy(station.modules, (m) => m.moduleId);
        const adding = _.difference(_.keys(incoming), _.keys(allExisting));
        const removed = _.difference(_.keys(stationExisting), _.keys(incoming));
        const keeping = _.intersection(_.keys(allExisting), _.keys(incoming));

        log.verbose(
            `synchronize modules`,
            JSON.stringify({
                stationId,
                all: _.values(allExisting).map((m) => [m.name, m.id]),
                positions: _.values(allExisting).map((m) => [m.name, m.position]),
                adding,
                removed,
                keeping,
            })
        );

        return Promise.all([
            Promise.all(
                adding.map((moduleId) =>
                    this.insertModule(stationId, incoming[moduleId]).then(() => this.synchronizeSensors(moduleId, incoming[moduleId], []))
                )
            ),
            Promise.all(
                removed.map((moduleId) =>
                    this.execute("DELETE FROM sensors WHERE module_id = ?", [stationExisting[moduleId].id]).then(() =>
                        this.execute("DELETE FROM modules WHERE id = ?", [stationExisting[moduleId].id])
                    )
                )
            ),
            Promise.all(
                keeping.map((moduleId) => {
                    const configuration = incoming[moduleId].configuration ? JSON.stringify(incoming[moduleId].configuration) : "";
                    const values = [
                        incoming[moduleId].name,
                        incoming[moduleId].flags || 0,
                        incoming[moduleId].position,
                        configuration,
                        stationId,
                        allExisting[moduleId].id,
                    ];
                    return this.execute(
                        "UPDATE modules SET name = ?, flags = ?, position = ?, status = ?, station_id = ? WHERE id = ?",
                        values
                    ).then(() => {
                        const moduleSensorRows = sensorRows.filter((r) => r.moduleId == allExisting[moduleId].id);
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

    public async resetSyncStatus(
        stationId: number,
        deviceId: string,
        generationId: string,
        streams: {
            fileType: FileType;
            firstBlock: number;
            lastBlock: number;
        }[]
    ): Promise<void> {
        const before = await this.query("SELECT * FROM streams WHERE device_id = ?", [deviceId]);
        console.log(`resetting-before: ${JSON.stringify(before)}`);

        // Delete all of the stream rows for the device, we're going to recreate one for the generation we just uploaded.
        await this.execute("DELETE FROM streams WHERE device_id = ?", [deviceId]);

        for (const stream of streams) {
            const values = [
                stationId,
                deviceId,
                generationId,
                FileTypeUtils.toString(stream.fileType),
                0,
                stream.firstBlock,
                stream.lastBlock,
                0,
                stream.firstBlock,
                stream.lastBlock,
                0,
                stream.firstBlock,
                stream.lastBlock,
                new Date(),
            ];
            await this.execute(
                `INSERT INTO streams
				 (station_id, device_id, generation_id, type, device_size, device_first_block, device_last_block,
				  download_size, download_first_block, download_last_block,
				  portal_size, portal_first_block, portal_last_block, updated)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                values
            );
        }

        const after = await this.query("SELECT * FROM streams WHERE device_id = ?", [deviceId]);
        console.log(`resetting-after: ${JSON.stringify(after)}`);
    }

    public async forgetUploads(): Promise<void> {
        await this.execute("UPDATE streams SET portal_size = NULL, portal_first_block = NULL, portal_last_block = NULL");
        await this.execute("UPDATE downloads SET uploaded = NULL");
    }

    public async forgetDownloads(): Promise<void> {
        await this.execute("DELETE FROM streams");
    }

    private async updateStream(streamId: number, generationId: string, stream: Stream): Promise<void> {
        const updates: Promise<void>[] = [];

        if (stream.deviceSize !== null && stream.deviceFirstBlock !== null && stream.deviceLastBlock !== null) {
            const values = [stream.deviceSize, stream.deviceFirstBlock, stream.deviceLastBlock, stream.updated, generationId, streamId];
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
            updates.push(
                this.execute(
                    `UPDATE streams SET download_size = ?, download_first_block = ?, download_last_block = ?, updated = ?, generation_id = ? WHERE id = ?`,
                    values
                )
            );
        }

        if (stream.portalSize !== null && stream.portalFirstBlock !== null && stream.portalLastBlock !== null) {
            const values = [stream.portalSize, stream.portalFirstBlock, stream.portalLastBlock, stream.updated, generationId, streamId];
            updates.push(
                this.execute(
                    `UPDATE streams SET portal_size = ?, portal_first_block = ?, portal_last_block = ?, updated = ?, generation_id = ? WHERE id = ?`,
                    values
                )
            );
        }

        await Promise.all(updates);
    }

    private async synchronizeStreams(stationId: number, station: Station, streamRows: StreamTableRow[]): Promise<void> {
        const incoming = _.keyBy(station.streams, (m) => m.type);
        const existing = _.keyBy(streamRows, (m) => m.type);
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.verbose("synchronize streams", stationId, adding, removed, keeping);

        await Promise.all([
            Promise.all(adding.map((name) => this.insertStream(stationId, incoming[name]))),
            Promise.all(removed.map((name) => this.query("DELETE FROM streams WHERE id = ?", [existing[name].id]))),
            Promise.all(
                keeping.map((name) =>
                    this.updateStream(existing[name].id, station.generationId, incoming[name].keepingFrom(existing[name]))
                )
            ),
        ]);
    }

    private async insertStation(newStation: Station): Promise<void> {
        log.info(`inserting station: ${JSON.stringify({ name: newStation.name, deviceId: newStation.deviceId })}`);
        await this.execute(
            `INSERT INTO stations (
				device_id, generation_id, name, archived, url, status,
				deploy_start_time, battery_level, consumed_memory, total_memory,
				consumed_memory_percent, schedules, status_json,
				longitude, latitude, serialized_status, updated, last_seen)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newStation.deviceId,
                newStation.generationId,
                newStation.name,
                newStation.archived ? 1 : 0,
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
                    this.query<ModuleTableRow>("SELECT * FROM modules ORDER BY position"),
                    this.query<SensorTableRow>("SELECT * FROM sensors WHERE module_id IN (SELECT id FROM modules) ORDER BY position"),
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
            })
            .then(() => {
                log.verbose(`station updated: ${JSON.stringify({ deviceId: station.deviceId })}`);
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

    public async insertDownload(download: DownloadTableRow): Promise<void> {
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
        return await this.execute(
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

    public async markDownloadAsUploaded(download: Download): Promise<void> {
        if (download.stationId === null || download.fileType === null) {
            log.error("malformed download row", download.stationId, download.fileType, download);
            throw new Error("malformed download row");
        }
        return await this.query("UPDATE downloads SET uploaded = ? WHERE id = ?", [new Date(), download.id]).then(() => {
            const values = [
                download.size,
                download.firstBlock,
                download.lastBlock,
                download.stationId,
                FileTypeUtils.toString(download.fileType),
            ];
            log.info(`mark as download updating streams:`, values);
            return this.execute(
                `UPDATE streams SET portal_size = COALESCE(portal_size, 0) + ?,
						            portal_first_block = MIN(COALESCE(portal_first_block, 0xffffffff), ?),
						            portal_last_block = MAX(COALESCE(portal_last_block, 0), ?)
				 WHERE station_id = ? AND type = ?`,
                values
            );
        });
    }

    private async getStationIdByDeviceId(deviceId: string): Promise<number | null> {
        if (!deviceId) {
            return Promise.reject(new Error(`invalid device id`));
        }
        return await this.query<{ id: number }>("SELECT id FROM stations WHERE device_id = ?", [deviceId]).then((rows) => {
            if (rows.length != 1) {
                return null;
            }
            return rows[0].id;
        });
    }

    // Firwmare

    public async getAllFirmware(): Promise<FirmwareTableRow[]> {
        return await this.query<FirmwareTableRow>("SELECT * FROM firmware ORDER BY time DESC");
    }

    public async getLatestFirmware(): Promise<FirmwareTableRow | null> {
        log.info("get-latest-firmware", await this.getAllFirmware());
        return await this.query<FirmwareTableRow>("SELECT * FROM firmware WHERE module = ? ORDER BY time DESC LIMIT 1", ["fk-core"]).then(
            (all) => {
                if (all.length == 0) {
                    return null;
                }
                return all[0];
            }
        );
    }

    public async deleteAllFirmware(): Promise<void> {
        await this.execute("DELETE FROM firmware");
    }

    public async deleteAllFirmwareExceptIds(ids: number[]): Promise<FirmwareTableRow[]> {
        if (ids.length == 0) {
            return [];
        }

        const values = _.range(ids.length)
            .map(() => "?")
            .join(",");

        return await this.query<FirmwareTableRow>("SELECT * FROM firmware WHERE id NOT IN (" + values + ")", ids).then((data) => {
            return this.execute("DELETE FROM firmware WHERE id NOT IN (" + values + ")", ids).then(() => {
                return data;
            });
        });
    }

    public async hasBootloader(): Promise<boolean> {
        const rows = await this.query<{ nrows: number }>("SELECT COUNT(*) AS nrows FROM firmware WHERE module = ?", ["fk-bl"]);
        return rows[0].nrows > 0;
    }

    public async addOrUpdateFirmware(firmware: FirmwareTableRow): Promise<void> {
        const ids = await this.query("SELECT id FROM firmware WHERE id = ?", [firmware.id]);
        if (ids.length === 1) {
            await this.execute(`UPDATE firmware SET logical_address = ? WHERE id = ?`, [firmware.logicalAddress, firmware.id]);
            return;
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
            firmware.logicalAddress,
        ];

        await this.execute(
            `INSERT INTO firmware (id, time, url, module, profile, etag, path, meta, build_time, build_number, logical_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values
        );
    }

    public async addOrUpdateNotes(notes: Notes): Promise<void> {
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

    public async getAllNotes(): Promise<NotesTableRow[]> {
        return await this.query<NotesTableRow>("SELECT * FROM notes")
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

    public async checkSettings(): Promise<void> {
        return await this.getSettings().then(async (rows) => {
            if (rows.length == 0) {
                log.info("settings: initializing");
                await this.insertSettings(Settings);
            }
        });
    }

    public async getSettings(): Promise<SettingsTableRow[]> {
        return await this.query<SettingsTableRow>("SELECT * FROM settings LIMIT 1")
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
            log.error(`error inserting settings: ${JSON.stringify(error)}`);
            throw new Error(`error inserting settings: ${JSON.stringify(error)}`);
        });
    }

    public async updateSettings(settings: Record<string, unknown>): Promise<void> {
        return await this.execute("UPDATE settings SET settings = ?", [JSON.stringify(settings)]).catch((error) => {
            log.error(`error updating settings: ${JSON.stringify(error)}`);
            throw new Error(`error updating settings: ${JSON.stringify(error)}`);
        });
    }

    public async getAllAccounts(): Promise<AccountsTableRow[]> {
        const rows = await this.query<AccountsTableRow>("SELECT * FROM accounts").catch((error) =>
            Promise.reject(new Error(`error fetching accounts: ${JSON.stringify(error)}`))
        );

        return rows.map((row) => {
            return {
                id: row.id,
                portalId: row.portalId,
                name: row.name,
                email: row.email,
                token: row.token == "" ? null : row.token,
                usedAt: row.usedAt,
                details: row.details,
            };
        });
    }

    public async removeAccount(email: string): Promise<void> {
        log.error(`deleting ${email}`);
        await this.execute(`DELETE FROM accounts WHERE email = ?`, [email]);
    }

    public async addOrUpdateAccounts(account: AccountsTableRow): Promise<void> {
        if (account.email == null) {
            return Promise.reject(new Error(`error saving account, email is required`));
        }
        return await this.query(`SELECT id FROM accounts WHERE email = ?`, [account.email])
            .then((maybeId: { id: number }[]) => {
                if (maybeId.length == 0) {
                    const values = [account.name, account.email, account.portalId, account.token, account.details, new Date()];
                    return this.execute(
                        `INSERT INTO accounts (name, email, portal_id, token, details, used_at) VALUES (?, ?, ?, ?, ?, ?)`,
                        values
                    );
                }
                const values = [account.name, account.email, account.portalId, account.token, account.details, new Date(), maybeId[0].id];
                return this.execute(
                    `UPDATE accounts SET name = ?, email = ?, portal_id = ?, token = ?, details = ?, used_at = ? WHERE id = ?`,
                    values
                );
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
                            silenced: row.silenced !== "false",
                            dismissedAt: row.dismissedAt,
                            satisfiedAt: row.satisfiedAt,
                            actions: JSON.parse(row.actions) as Record<string, unknown>,
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
        log.info("add-notifications", notification);
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
                        JSON.stringify(notification.actions),
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
        log.info("update-notification", notification);
        await this.query<NotificationsTableRow>(`SELECT * FROM notifications WHERE key = ?`, [notification.key])
            .then((maybe) => {
                if (maybe.length > 0) {
                    const dbValues = maybe[0];
                    const values = [
                        notification.key ?? dbValues.key,
                        notification.kind ?? dbValues.kind,
                        notification.silenced,
                        notification.dismissedAt ?? dbValues.dismissedAt,
                        notification.satisfiedAt ?? dbValues.satisfiedAt,
                        notification.project ? JSON.stringify(notification.project) : dbValues.project,
                        notification.user ? JSON.stringify(notification.user) : dbValues.user,
                        notification.station ? JSON.stringify(notification.station) : dbValues.station,
                        notification.actions ? JSON.stringify(notification.actions) : dbValues.actions,
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
            log.error(`add-store-log error`, error);
        }
    }

    public async cleanup(): Promise<void> {
        try {
            await this.execute("DELETE FROM sensors WHERE module_id IN (SELECT id FROM modules WHERE module_id IS NULL)");
            await this.execute("DELETE FROM modules WHERE module_id IS NULL");
            await this.purgeOldLogs();
        } catch (error) {
            log.error(`cleanup error`, error);
        }
    }

    public async getAllMedia(): Promise<NoteMedia[]> {
        const rows = await this.getAllNotes();
        const notes = rows.map((r) => {
            const obj = new Notes(0, new Date(), new Date());
            const filled = _.extend(obj, r.notesObject);
            if (filled.stationId === 0) throw new Error(`failed to hydrate notes`);
            return filled;
        });
        log.info(`notes: ${JSON.stringify(notes)}`);
        return _.flatten(notes.map((notes) => notes.allMedia()));
    }

    private logAppends: { [deviceId: string]: Date } = {};

    private shouldAppend(deviceId: string): boolean {
        if (!this.logAppends[deviceId]) {
            return true;
        }
        const now = new Date();
        const seconds = (now.getTime() - this.logAppends[deviceId].getTime()) / 1000;
        if (seconds > 30) {
            return true;
        }
        console.log(`append-station-log: skipped ${seconds}`);
        return false;
    }

    public async appendStationLogs(deviceId: string, logs: string): Promise<void> {
        try {
            const now = new Date();
            if (this.shouldAppend(deviceId)) {
                const values = [now, deviceId, logs.trim()];
                await this.execute("INSERT INTO station_log (time, device_id, logs) VALUES (?, ?, ?)", values);
                this.logAppends[deviceId] = now;
                console.log(`append-station-log`);
            }
        } catch (error) {
            log.error(`append-station-log error`, error);
        }
    }

    public async purgeOldLogs(): Promise<void> {
        const now = new Date();
        await this.purgeTable({
            name: "store_log",
            status: "SELECT COUNT(*) AS nlogs FROM store_log",
            purge: "DELETE FROM store_log WHERE time < ?",
            epoch: now.getTime() - 1 * 60 * 1000,
        });
        await this.purgeTable({
            name: "station_log",
            status: "SELECT COUNT(*) AS nlogs FROM station_log",
            purge: "DELETE FROM station_log WHERE time < ?",
            epoch: now.getTime() - 1 * 10 * 1000,
        });
        await this.execute("VACUUM");
    }

    private async purgeTable(table: { name: string; status: string; purge: string; epoch: number }): Promise<void> {
        const before = await this.query<{ nlogs: number }>(table.status);

        await this.execute(table.purge, [table.epoch]);

        const after = await this.query<{ nlogs: number }>(table.status);

        const times = await this.query(`SELECT MIN(time), MAX(time) FROM station_log`);
        log.info(`${table.name} times ${JSON.stringify(before)} ${JSON.stringify(after)} ${JSON.stringify(times)}`);
    }

    public async getStoredNetworks(): Promise<StoredNetworkTableRow[]> {
        const rows = await this.query<StoredNetworkTableRow>("SELECT * FROM stored_networks").catch((error) =>
            Promise.reject(new Error(`error fetching stored networks: ${JSON.stringify(error)}`))
        );

        return rows.map((row) => {
            return {
                id: row.id,
                name: row.name,
                created: row.created,
            };
        });
    }

    public async addStoredNetwork(name: string): Promise<void> {
        if (name == null) {
            return Promise.reject(new Error(`error saving stored network, name is required`));
        }
        return await this.query(`SELECT id FROM stored_networks WHERE name = ?`, [name])
            .then((maybeId: { id: number }[]) => {
                if (maybeId.length == 0) {
                    const values = [name, new Date()];
                    return this.execute(`INSERT INTO stored_networks (name, created) VALUES (?, ?)`, values);
                }

                return Promise.reject(new Error(`error adding stored network`));
            })
            .catch((error) => Promise.reject(new Error(`error adding stored network: ${JSON.stringify(error)}`)));
    }

    public async forgetStation(stationId: number): Promise<void> {
        await this.execute(`BEGIN TRANSACTION`);

        try {
            await this.execute("DELETE FROM downloads WHERE station_id = ?", [stationId]);
            await this.execute("DELETE FROM fieldmedia WHERE station_id = ?", [stationId]);

            const moduleIds = (await this.query("SELECT id FROM modules WHERE station_id = ?", [stationId])).map((item: { id: number }) => {
                return item.id;
            });

            const values = _.range(moduleIds.length)
                .map(() => "?")
                .join(",");

            if (moduleIds) {
                await this.execute("DELETE FROM modules_config WHERE module_id IN (" + values + ")", moduleIds);
                await this.execute("DELETE FROM sensors WHERE module_id IN (" + values + ")", moduleIds);
                await this.execute("DELETE FROM modules WHERE id IN (" + values + ")", moduleIds);
            }

            await this.execute("DELETE FROM notes WHERE station_id = ?", [stationId]);
            await this.execute("DELETE FROM station_addresses WHERE station_id = ?", [stationId]);
            await this.execute("DELETE FROM stations_config WHERE station_id = ?", [stationId]);
            await this.execute("DELETE FROM streams WHERE station_id = ?", [stationId]);
            await this.execute("DELETE FROM stations WHERE id = ?", [stationId]);

            return this.execute(`COMMIT TRANSACTION`);
        } catch (error) {
            log.error(`error forgetting station JSON: ${JSON.stringify(error)}`);
            return this.execute(`ROLLBACK TRANSACTION`);
        }
    }
}
