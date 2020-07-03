import _ from "lodash";
import Config from "../config";
import { sqliteToJs } from "../utilities";
import { Download, FileTypeUtils } from "../store/types";
import { DownloadTableRow } from "../store/row-types";

const log = Config.logger("DbInterface");

export default class DatabaseInterface {
    services: any;

    constructor(services) {
        this.services = services;
    }

    public checkConfig() {
        return this.getConfig().then(result => {
            if (result.length == 0) {
                console.log("config: intializing", Config);
                return this.insertConfig(Config);
            } else {
                console.log("config: * actual baseUri and ingestionUri *", result[0]);
            }
        });
    }

    private getDatabase() {
        return this.services.CreateDb().getDatabase();
    }

    public getStationConfigs(stationId) {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM stations_config WHERE station_id = ?", [stationId]))
            .then(rows => {
                return sqliteToJs(rows);
            });
    }

    public getAll() {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM stations"))
            .then(rows => {
                rows.map(r => {
                    r.status_json = JSON.parse(r.status_json);
                    return r;
                });
                return sqliteToJs(rows);
            })
            .catch(err => Promise.reject(new Error(`error fetching stations: ${err}`)));
    }

    public getModuleAll() {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM modules ORDER BY station_id"))
            .then(rows => sqliteToJs(rows));
    }

    public getSensorAll() {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM sensors ORDER BY module_id"))
            .then(rows => sqliteToJs(rows));
    }

    public getStreamAll() {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM streams ORDER BY station_id"))
            .then(rows => sqliteToJs(rows));
    }

    public getDownloadAll() {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM downloads ORDER BY station_id"))
            .then(rows => sqliteToJs(rows));
    }

    public getStation(stationId) {
        throw new Error("deprecated");
    }

    public getStationByDeviceId(deviceId) {
        throw new Error("deprecated");
    }

    public getModule(moduleId) {
        throw new Error("deprecated");
    }

    public getModuleByDeviceId(deviceId) {
        throw new Error("deprecated");
    }

    public getModules(stationId) {
        throw new Error("deprecated");
    }

    public removeModule(moduleId) {
        throw new Error("deprecated");
    }

    public removeNullIdModules() {
        return this.getDatabase().then(db => db.query("DELETE FROM modules WHERE device_id IS NULL"));
    }

    public getSensors(moduleDeviceId) {
        return this.getDatabase()
            .then(db =>
                this._getModulePrimaryKey(moduleDeviceId).then(modulePrimaryKey =>
                    db.query("SELECT * FROM sensors WHERE module_id = ?", [modulePrimaryKey]).catch(err => Promise.reject(new Error(`error getting sensors: ${err}`)))
                )
            )
            .then(rows => sqliteToJs(rows));
    }

    public getFieldNotes(stationId) {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM fieldnotes WHERE station_id = ?", [stationId]))
            .then(rows => sqliteToJs(rows));
    }

    public updateFieldNote(fieldnote) {
        return this.getDatabase().then(db =>
            db.query("UPDATE fieldnotes SET note = ?, audio_file = ?, author = ?, title = ?, updated = ? WHERE id = ?", [
                fieldnote.value,
                fieldnote.audioFile,
                fieldnote.author,
                fieldnote.title,
                new Date(),
                fieldnote.fieldNoteId,
            ])
        );
    }

    public getFieldMedia(stationId) {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM fieldmedia WHERE station_id = ?", [stationId]))
            .then(rows => sqliteToJs(rows));
    }

    public getConfig() {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM config"))
            .then(rows => sqliteToJs(rows));
    }

    public updateConfigUris(config) {
        return this.getDatabase().then(db => db.query("UPDATE config SET base_uri = ?, ingestion_uri = ? WHERE id = ?", [config.baseUri, config.ingestionUri, config.id]));
    }

    public updateBaseUri(config) {
        return this.getDatabase().then(db => db.query("UPDATE config SET base_uri = ? WHERE id = ?", [config.baseUri, config.id]));
    }

    public updateIngestionUri(config) {
        return this.getDatabase().then(db => db.query("UPDATE config SET ingestion_uri = ? WHERE id = ?", [config.ingestionUri, config.id]));
    }

    public setStationName(station) {
        return this.getDatabase().then(db => db.query("UPDATE stations SET name = ?, updated = ? WHERE id = ?", [station.name, new Date(), station.id]));
    }

    public setStationPortalId(station) {
        return this.getDatabase()
            .then(db => db.query("UPDATE stations SET portal_id = ?, updated = ? WHERE id = ?", [station.portalId, new Date(), station.id]))
            .catch(error => `error setting portal id ${error}`);
    }

    public setStationLocationCoordinates(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET latitude = ?, longitude = ?, updated = ? WHERE id = ?", [station.latitude, station.longitude, new Date(), station.id])
        );
    }

    public setStationLocationName(station) {
        return this.getDatabase().then(db => db.query("UPDATE stations SET location_name = ?, updated = ? WHERE id = ?", [station.locationName, new Date(), station.id]));
    }

    public setStationStudyObjective(station) {
        return this.getDatabase().then(db => db.query("UPDATE stations SET study_objective = ?, updated = ? WHERE id = ?", [station.studyObjective, new Date(), station.id]));
    }

    public setStationLocationPurpose(station) {
        return this.getDatabase().then(db => db.query("UPDATE stations SET location_purpose = ?, updated = ? WHERE id = ?", [station.locationPurpose, new Date(), station.id]));
    }

    public setStationSiteCriteria(station) {
        return this.getDatabase().then(db => db.query("UPDATE stations SET site_criteria = ?, updated = ? WHERE id = ?", [station.siteCriteria, new Date(), station.id]));
    }

    public setStationSiteDescription(station) {
        return this.getDatabase().then(db => db.query("UPDATE stations SET site_description = ?, updated = ? WHERE id = ?", [station.siteDescription, new Date(), station.id]));
    }

    public setStationPercentComplete(station) {
        return this.getDatabase().then(db => db.query("UPDATE stations SET percent_complete = ?, updated = ? WHERE id = ?", [station.percentComplete, new Date(), station.id]));
    }

    public setStationPortalError(station, errorCode) {
        return this.getDatabase()
            .then(db => db.query("UPDATE stations SET portal_http_error = ?, updated = ? WHERE id = ?", [errorCode, new Date(), station.id]))
            .catch(error => `error setting portal error ${error}`);
    }

    public setModuleName(module) {
        return this.getDatabase().then(db => db.query("UPDATE modules SET name = ? WHERE device_id = ?", [module.name, module.deviceId]));
    }

    public setModulePosition(module) {
        return this.getDatabase().then(db => db.query("UPDATE modules SET position = ? WHERE device_id = ?", [module.position, module.deviceId]));
    }

    public setModuleInterval(module) {
        return this.getDatabase().then(db => db.query("UPDATE modules SET interval = ? WHERE id = ?", [module.interval, module.id]));
    }

    public setModuleGraphs(module) {
        return this.getDatabase().then(db => db.query("UPDATE modules SET graphs = ? WHERE id = ?", [module.graphs, module.id]));
    }

    public setCurrentReading(sensor) {
        return this.getDatabase().then(db => db.query("UPDATE sensors SET current_reading = ? WHERE id = ?", [sensor.currentReading, sensor.id]));
    }

    public clearDeployNotes(station) {
        return this.getDatabase().then(db =>
            db.query(
                "UPDATE stations SET location_name = '', study_objective = '', location_purpose = '', site_criteria = '', site_description = '', deploy_start_time = '', percent_complete = ? WHERE id = ?",
                [0, station.id]
            )
        );
    }

    private _updateStation(station) {
        if (!station.id) {
            return Promise.reject(new Error(`no station id in update station`));
        }

        // For the time being, need to not update the fields that are being set individually,
        // as they get overwritten with null if we do. Those include:
        // station.locationName,
        // station.studyObjective,
        // station.locationPurpose,
        // station.siteCriteria,
        // station.siteDescription,
        // station.percentComplete,

        const values = [
            station.connected,
            station.generationId,
            station.name,
            station.url || "", // TODO remove
            station.portalId,
            station.status,
            station.deployStartTime,
            station.batteryLevel,
            station.consumedMemory,
            station.totalMemory,
            station.consumedMemoryPercent, // TODO remove
            station.interval,
            JSON.stringify(station.statusJson),
            station.longitude,
            station.latitude,
            station.serializedStatus,
            new Date(),
            station.lastSeen,
            station.id,
        ];
        return this.getDatabase().then(db =>
            db.execute(
                `
					UPDATE stations SET connected = ?, generation_id = ?, name = ?, url = ?, portal_id = ?, status = ?,
						   deploy_start_time = ?, battery_level = ?, consumed_memory = ?, total_memory = ?, consumed_memory_percent = ?,
						   interval = ?, status_json = ?, longitude = ?, latitude = ?, serialized_status = ?, updated = ?, last_seen = ?
					WHERE id = ?`,
                values
            )
        );
    }

    recordStationConfigChange(config) {
        return this.getDatabase().then(db =>
            db.query("INSERT INTO stations_config (station_id, before, after, affected_field, author) VALUES (?, ?, ?, ?, ?)", [
                config.stationId,
                config.before,
                config.after,
                config.affectedField,
                config.author,
            ])
        );
    }

    recordModuleConfigChange(config) {
        return this.getDatabase().then(db =>
            db.query("INSERT INTO modules_config (module_id, before, after, affected_field, author) VALUES (?, ?, ?, ?, ?)", [
                config.moduleId,
                config.before,
                config.after,
                config.affectedField,
                config.author,
            ])
        );
    }

    private _getModulePrimaryKey(deviceId) {
        if (_.isString(deviceId)) {
            return this.getDatabase().then(db =>
                db.query("SELECT id FROM modules WHERE device_id = ? ORDER BY id DESC", [deviceId]).then(rows => {
                    if (rows.length == 0) {
                        return Promise.reject(new Error(`no such module: ${deviceId} ${rows.length}`));
                    }
                    if (rows.length > 1) {
                        const keeping = rows[0];
                        console.log(`deleting duplicate modules ${deviceId} ${rows.length}`);
                        return db.query("DELETE FROM sensors WHERE module_id IN (SELECT id FROM modules WHERE device_id = ? AND id != ?)", [deviceId, keeping]).then(() => {
                            return db.query("DELETE FROM modules WHERE device_id = ? AND id != ?", [deviceId, keeping]).then(() => {
                                return keeping;
                            });
                        });
                    }
                    return rows[0].id;
                })
            );
        }
        return Promise.resolve(deviceId);
    }

    private _insertSensor(sensor) {
        return this.getDatabase().then(db =>
            this._getModulePrimaryKey(sensor.moduleId).then(modulePrimaryKey =>
                db
                    .execute("INSERT INTO sensors (module_id, name, unit, frequency, current_reading) VALUES (?, ?, ?, ?, ?)", [
                        modulePrimaryKey,
                        sensor.name,
                        sensor.unitOfMeasure,
                        sensor.frequency,
                        sensor.currentReading | sensor.reading,
                    ])
                    .catch(err => Promise.reject(new Error(`error inserting sensor: ${err}`)))
            )
        );
    }

    private _insertModule(module) {
        // Note: device_id is the module's unique hardware id (not the station's)
        return this.getDatabase().then(db =>
            db
                .execute("INSERT INTO modules (module_id, device_id, name, interval, position, station_id) VALUES (?, ?, ?, ?, ?, ?)", [
                    module.moduleId || module.deviceId,
                    module.deviceId || module.moduleId,
                    module.name,
                    module.interval || 0,
                    module.position,
                    module.stationId,
                ])
                .catch(err => Promise.reject(new Error(`error inserting module: ${err}`)))
        );
    }

    private _synchronizeSensors(db, moduleId, module, sensorRows) {
        // TODO: include position?
        const incoming = _.keyBy(module.sensors, s => s.name);
        const existing = _.keyBy(sensorRows, s => s.name);
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.verbose("synchronize sensors", adding, removed, keeping);

        return Promise.all([
            Promise.all(adding.map(name => this._insertSensor(_.merge({ moduleId: module.moduleId, deviceId: module.moduleId }, incoming[name])))),
            Promise.all(removed.map(name => db.query("DELETE FROM sensors WHERE id = ?", [existing[name].id]))),
            Promise.all(
                keeping
                    .map(name => {
                        const previous = existing[name].currentReading;
                        const current = incoming[name].reading;
                        // console.log("COMPARE", previous, current);
                        const trend = current == previous ? 0 : current > previous ? 1 : -1;
                        return {
                            id: existing[name].id,
                            reading: incoming[name].reading,
                            trend: trend,
                        };
                    })
                    .filter(update => update.reading != null)
                    .map(update => db.query("UPDATE sensors SET current_reading = ?, trend = ? WHERE id = ?", [update.reading, update.trend, update.id]))
            ),
        ]);
    }

    private _synchronizeModules(db, stationId, station, moduleRows, sensorRows) {
        const incoming = _.keyBy(station.modules, m => m.moduleId);
        const existing = _.keyBy(moduleRows, m => m.moduleId || m.deviceId);
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.verbose("synchronize modules", stationId, adding, removed, keeping);

        return Promise.all([
            Promise.all(
                adding.map(moduleId =>
                    this._insertModule(_.extend({ stationId: stationId }, incoming[moduleId])).then(() => this._synchronizeSensors(db, moduleId, incoming[moduleId], []))
                )
            ),
            Promise.all(
                removed.map(moduleId =>
                    db.query("DELETE FROM sensors WHERE module_id = ?", [existing[moduleId].id]).then(() => {
                        db.query("DELETE FROM modules WHERE id = ?", [existing[moduleId].id]);
                    })
                )
            ),
            Promise.all(
                keeping.map(moduleId => {
                    const moduleSensorRows = sensorRows.filter(r => r.moduleId == existing[moduleId].id);
                    return this._synchronizeSensors(db, moduleId, incoming[moduleId], moduleSensorRows);
                })
            ),
        ]);
    }

    private _insertStream(db, stationId, stream) {
        // NOTE We're always created for the first time from a status
        // reply and these are the values we're guaranteed to get from
        // those, to avoid inserting NULLs, which the Android SQLITE
        // library seems to handle poorly?!
        const values = [stationId, stream.deviceId, stream.type, stream.deviceSize, stream.deviceFirstBlock, stream.deviceLastBlock, new Date()];
        return db.execute(`INSERT INTO streams (station_id, device_id, type, device_size, device_first_block, device_last_block, updated) VALUES (?, ?, ?, ?, ?, ?, ?)`, values);
    }

    private _updateStream(db, streamId, stream) {
        const updates: Promise<any>[] = [];

        if (stream.deviceSize !== null && stream.deviceFirstBlock !== null && stream.deviceLastBlock !== null) {
            updates.push(
                db.query(`UPDATE streams SET device_size = ?, device_first_block = ?, device_last_block = ?, updated = ? WHERE id = ?`, [
                    stream.deviceSize,
                    stream.deviceFirstBlock,
                    stream.deviceLastBlock,
                    stream.updated,
                    streamId,
                ])
            );
        }

        if (stream.downloadSize !== null && stream.downloadFirstBlock !== null && stream.downloadLastBlock !== null) {
            updates.push(
                db.query(`UPDATE streams SET download_size = ?, download_first_block = ?, download_last_block = ?, updated = ? WHERE id = ?`, [
                    stream.downloadSize,
                    stream.downloadFirstBlock,
                    stream.downloadLastBlock,
                    stream.updated,
                    streamId,
                ])
            );
        }

        if (stream.portalSize !== null && stream.portalFirstBlock !== null && stream.portalLastBlock !== null) {
            updates.push(
                db.query(`UPDATE streams SET portal_size = ?, portal_first_block = ?, portal_last_block = ?, updated = ? WHERE id = ?`, [
                    stream.portalSize,
                    stream.portalFirstBlock,
                    stream.portalLastBlock,
                    stream.updated,
                    streamId,
                ])
            );
        }

        return Promise.all(updates);
    }

    private _synchronizeStreams(db, stationId, station, streamRows) {
        const incoming = _.keyBy(station.streams, m => m.type);
        const existing = _.keyBy(streamRows, m => m.type);
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.verbose("synchronize streams", stationId, adding, removed, keeping);

        return Promise.all([
            Promise.all(adding.map(name => this._insertStream(db, stationId, incoming[name]))),
            Promise.all(removed.map(name => db.query("DELETE FROM streams WHERE id = ?", [existing[name].id]))),
            Promise.all(keeping.map(name => this._updateStream(db, existing[name].id, incoming[name].keepingFrom(existing[name])))),
        ]);
    }

    private _insertStation(newStation, statusJson) {
        return this.getDatabase().then(db =>
            db
                .execute(
                    `
					INSERT INTO stations (device_id,
						generation_id, name, url, status,
						deploy_start_time, battery_level, consumed_memory, total_memory,
						consumed_memory_percent, interval, status_json,
						longitude, latitude, serialized_status, updated, last_seen)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newStation.deviceId,
                        newStation.generationId,
                        newStation.name,
                        "", // TODO remove
                        newStation.status,
                        newStation.deployStartTime,
                        newStation.batteryLevel,
                        newStation.consumedMemory,
                        newStation.totalMemory,
                        newStation.consumedMemoryPercent, // TODO remove
                        newStation.interval,
                        JSON.stringify(statusJson),
                        newStation.longitude,
                        newStation.latitude,
                        newStation.serializedStatus,
                        new Date(),
                        newStation.lastSeen,
                    ]
                )
                .catch(err => Promise.reject(new Error(`error inserting station: ${err}`)))
        );
    }

    public addOrUpdateStation(station) {
        return this.getDatabase().then(db => {
            return this.getStationIdByDeviceId(station.deviceId)
                .then(id => {
                    if (id === null) {
                        return this._insertStation(station, null);
                    }
                    return this._updateStation(_.merge({}, station, { id: id }));
                })
                .then(() => this.getStationIdByDeviceId(station.deviceId))
                .then(stationId => {
                    return Promise.all([
                        db.query("SELECT * FROM modules WHERE station_id = ?", [stationId]).then(r => sqliteToJs(r)),
                        db.query("SELECT * FROM sensors WHERE module_id IN (SELECT id FROM modules WHERE station_id = ?)", [stationId]).then(r => sqliteToJs(r)),
                        db.query("SELECT * FROM streams WHERE station_id = ?", [stationId]).then(r => sqliteToJs(r)),
                    ]).then(all => {
                        const moduleRows = all[0];
                        const sensorRows = all[1];
                        const streamRows = all[2];
                        return this._synchronizeModules(db, stationId, station, moduleRows, sensorRows).then(() => {
                            return this._synchronizeStreams(db, stationId, station, streamRows);
                        });
                    });
                });
        });
    }

    public insertConfig(config) {
        return this.getDatabase().then(db => db.execute("INSERT INTO config (base_uri, ingestion_uri) VALUES (?, ?)", [config.baseUri, config.ingestionUri]));
    }

    public insertFieldNote(note) {
        return this.getDatabase().then(db =>
            db.execute("INSERT INTO fieldnotes (station_id, generation_id, note, title, audio_file, category, author) VALUES (?, ?, ?, ?, ?, ?, ?)", [
                note.stationId,
                note.generationId,
                note.note,
                note.title,
                note.audioFile,
                note.category,
                note.author,
            ])
        );
    }

    public insertFieldMedia(media) {
        return this.getDatabase().then(db =>
            db.execute("INSERT INTO fieldmedia (station_id, generation_id, image_name, image_label, category, author) VALUES (?, ?, ?, ?, ?, ?)", [
                media.stationId,
                media.generationId,
                media.imageName,
                media.imageLabel,
                media.category,
                media.author,
            ])
        );
    }

    public removeFieldNote(noteId) {
        return this.getDatabase().then(db => db.query("DELETE FROM fieldnotes WHERE id = ?", [noteId]));
    }

    public removeFieldNoteByAudioFile(audioFile) {
        return this.getDatabase().then(db => db.query("DELETE FROM fieldnotes WHERE audio_file = ?", [audioFile]));
    }

    public removeFieldMedia(mediaId) {
        return this.getDatabase().then(db => db.query("DELETE FROM fieldmedia WHERE id = ?", [mediaId]));
    }

    public getAllFirmware() {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM firmware ORDER BY time DESC"))
            .then(rows => sqliteToJs(rows));
    }

    public getLatestFirmware() {
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM firmware ORDER BY time DESC LIMIT 1"))
            .then(rows => sqliteToJs(rows))
            .then(all => {
                if (all.length == 0) {
                    return null;
                }
                return all[0];
            });
    }

    public deleteFirmwareById(id) {
        return this.getDatabase().then(db => db.query("DELETE FROM firmware WHERE id = ?", [id]));
    }

    public deleteAllFirmwareExceptIds(ids) {
        const values = _.range(ids.length)
            .map(() => "?")
            .join(",");
        return this.getDatabase()
            .then(db => db.query("SELECT * FROM firmware WHERE id NOT IN (" + values + ")", ids))
            .then(data => {
                return this.getDatabase()
                    .then(db => db.query("DELETE FROM firmware WHERE id NOT IN (" + values + ")", ids))
                    .then(() => {
                        return data;
                    });
            });
    }

    public addOrUpdateFirmware(firmware) {
        return this.getDatabase()
            .then(db => db.query("SELECT id FROM firmware WHERE id = ?", [firmware.id]))
            .then(id => {
                if (id.length === 1) {
                    return Promise.resolve(id[0]);
                }
                const values = [
                    firmware.id,
                    firmware.time,
                    firmware.url,
                    firmware.module,
                    firmware.profile,
                    firmware.etag,
                    firmware.path,
                    firmware.meta,
                    firmware.buildTime,
                    firmware.buildNumber,
                ];
                return this.getDatabase().then(db =>
                    db.execute(`INSERT INTO firmware (id, time, url, module, profile, etag, path, meta, build_time, build_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, values)
                );
            });
    }

    public insertDownload(download: DownloadTableRow) {
        return this.getDatabase().then(db => {
            return db
                .execute(
                    `INSERT INTO downloads (station_id, device_id, generation, path, type, timestamp, url, size, blocks, first_block, last_block)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
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
                    ]
                )
                .then(() => {
                    const values = [download.size, download.firstBlock, download.lastBlock, download.lastBlock, download.stationId, download.type];
                    return db.execute(
                        `UPDATE streams SET download_size = COALESCE(download_size, 0) + ?,
							                download_first_block = MIN(COALESCE(download_first_block, 0xffffffff), ?),
							                download_last_block = MAX(COALESCE(download_last_block, 0), ?),
							                device_last_block = MAX(COALESCE(device_last_block, 0), ?)
						 WHERE station_id = ? AND type = ?`,
                        values
                    );
                })
                .catch(err => Promise.reject(new Error(`error inserting download: ${err}`)));
        });
    }

    public markDownloadAsUploaded(download: Download) {
        if (download.stationId === null || download.fileType === null) {
            console.log("malformed download row", download.stationId, download.fileType, download);
            throw new Error("malformed download row");
        }
        return this.getDatabase().then(db => {
            return db.query("UPDATE downloads SET uploaded = ? WHERE id = ?", [new Date(), download.id]).then(() => {
                const values = [download.size, download.firstBlock, download.lastBlock, download.stationId, FileTypeUtils.toString(download.fileType)];
                return db.execute(
                    `UPDATE streams SET portal_size = COALESCE(portal_size, 0) + ?,
							            portal_first_block = MIN(COALESCE(portal_first_block, 0xffffffff), ?),
							            portal_last_block = MAX(COALESCE(portal_last_block, 0), ?)
					 WHERE station_id = ? AND type = ?`,
                    values
                );
            });
        });
    }

    private getStationIdByDeviceId(deviceId) {
        if (!deviceId) {
            return Promise.reject(new Error(`invalid device id`));
        }
        return this.getDatabase()
            .then(db => db.query("SELECT id FROM stations WHERE device_id = ?", [deviceId]))
            .then(rows => {
                if (rows.length != 1) {
                    return null;
                }
                return rows[0].id;
            });
    }

    public addEvent(event) {
        const values = [event.createdAt, event.type, JSON.stringify(event.body)];
        return this.getDatabase().then(db => db.query("INSERT INTO event_history (created_at, type, body) VALUES (? , ?, ?)", values));
    }
}
