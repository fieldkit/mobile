import Config from "../config";
import Sqlite from "../wrappers/sqlite";

const sqlite = new Sqlite();

// thirty seconds
const minInterval = 30;
// two weeks (in seconds)
const maxInterval = 1209600;

let databasePromise;

const MetaStreamName = 'meta';
const DataStreamName = 'data';

export default class DatabaseInterface {
    constructor() {
        databasePromise = this.openDatabase();
        this.databasePromise = databasePromise;
    }

    getDatabaseName() {
        if (TNS_ENV === "test") {
            return "test_fieldkit.sqlite3";
        }
        return "fieldkit.sqlite3";
    }

    openDatabase() {
        return sqlite.open(this.getDatabaseName()).then(db => {
            return (this.database = db);
        });
    }

    getDatabase() {
        return databasePromise;
    }

    getStationConfigs(stationId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM stations_config WHERE station_id = ?", [stationId])
        );
    }

    getModuleConfigs(moduleId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM modules_config WHERE module_id = ?", [moduleId])
        );
    }

    getDatabase() {
        return this.databasePromise;
    }

    getAll() {
        return this.getDatabase().then(db => db.query("SELECT * FROM stations"));
    }

    getStation(stationId) {
        return this.getDatabase().then(db => db.query("SELECT * FROM stations WHERE id = ?", [stationId]));
    }

    getStationByDeviceId(deviceId) {
        // newly discovered stations don't have ids yet, so check by deviceId
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM stations WHERE device_id = ?", [deviceId])
        );
    }

    getModule(moduleId) {
        return this.getDatabase().then(db => db.query("SELECT * FROM modules WHERE id = ?", [moduleId]));
    }

    getModules(stationId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM modules WHERE station_id = ?", [stationId])
        );
    }

    getSensors(moduleId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM sensors WHERE module_id = ?", [moduleId])
        );
    }

    setStationName(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET name = ? WHERE id = ?", [station.name, station.id])
        );
    }

    setStationPortalID(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET portal_id = ? WHERE id = ?", [station.portalId, station.id])
        );
    }

    setStationConnectionStatus(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET connected = ? WHERE id = ?", [station.connected, station.id])
        );
    }

    setStationLocationCoordinates(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET latitude = ?, longitude = ? WHERE id = ?", [
                station.latitude,
                station.longitude,
                station.id
            ])
        );
    }

    setStationLocationName(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET location_name = ? WHERE id = ?", [
                station.location_name,
                station.id
            ])
        );
    }

    setStationInterval(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET interval = ? WHERE id = ?", [station.interval, station.id])
        );
    }

    setStationDeployImage(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET deploy_image_name = ? WHERE id = ?", [
                station.deploy_image_name,
                station.id
            ])
        );
    }

    setStationDeployImageLabel(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET deploy_image_label = ? WHERE id = ?", [
                station.deploy_image_label,
                station.id
            ])
        );
    }

    setStationDeployNote(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET deploy_note = ? WHERE id = ?", [station.deploy_note, station.id])
        );
    }

    setStationDeployAudio(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET deploy_audio_files = ? WHERE id = ?", [
                station.deploy_audio_files,
                station.id
            ])
        );
    }

    setStationDeployStatus(station) {
        return this.getDatabase().then(db =>
            db.query("UPDATE stations SET status = ? WHERE id = ?", [station.status, station.id])
        );
    }

    setModuleName(module) {
        return this.getDatabase().then(db =>
            db.query("UPDATE modules SET name = ? WHERE id = ?", [module.name, module.id])
        );
    }

    setModuleInterval(module) {
        return this.getDatabase().then(db =>
            db.query("UPDATE modules SET interval = ? WHERE id = ?", [module.interval, module.id])
        );
    }

    setModuleGraphs(module) {
        return this.getDatabase().then(db =>
            db.query("UPDATE modules SET graphs = ? WHERE id = ?", [module.graphs, module.id])
        );
    }

    setCurrentReading(sensor) {
        return this.getDatabase().then(db =>
            db.query("UPDATE sensors SET current_reading = ? WHERE id = ?", [
                sensor.current_reading,
                sensor.id
            ])
        );
    }

    recordStationConfigChange(config) {
        return this.getDatabase().then(db =>
            db.query(
                "INSERT INTO stations_config (station_id, before, after, affected_field, author) VALUES (?, ?, ?, ?, ?)",
                [config.station_id, config.before, config.after, config.affected_field, config.author]
            )
        );
    }

    recordModuleConfigChange(config) {
        return this.getDatabase().then(db =>
            db.query(
                "INSERT INTO modules_config (module_id, before, after, affected_field, author) VALUES (?, ?, ?, ?, ?)",
                [config.module_id, config.before, config.after, config.affected_field, config.author]
            )
        );
    }

    insertSensor(sensor) {
        return this.database.execute(
            "INSERT INTO sensors (module_id, name, unit, frequency, current_reading) VALUES (?, ?, ?, ?, ?)",
            [sensor.moduleId, sensor.name, sensor.unitOfMeasure, sensor.frequency, sensor.current_reading]
        );
    }

    insertModule(module) {
        return this.database.execute(
            "INSERT INTO modules (module_id, device_id, name, interval, station_id) VALUES (?, ?, ?, ?, ?)",
            [module.moduleId, module.deviceId, module.name, module.interval || 0, module.stationId]
        );
    }

    insertStation(station, status_json) {
        const newStation = new Station(station);
        return this.database.execute(`INSERT INTO stations (device_id, name, url, status, battery_level, connected, available_memory, interval, status_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newStation.deviceId,
                newStation.name,
                newStation.url,
                newStation.status,
                newStation.battery_level,
                newStation.connected,
                newStation.available_memory,
                newStation.interval,
                JSON.stringify(status_json)
            ]
        );
    }

    insertDownload(download) {
        return this.insertDownloads([ download ]);
    }

    insertDownloads(downloads) {
        return Promise.all(downloads.map(download => {
            return this.database.execute(`INSERT INTO downloads (station_id, device_id, path, name, timestamp, url, size, blocks, first_block, last_block) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                download.stationId,
                download.deviceId,
                download.path,
                download.name,
                download.timestamp,
                download.url,
                download.size,
                download.blocks,
                download.firstBlock,
                download.lastBlock,
            ]);
        }));
    }

    getAllDownloads() {
        return this.getDatabase().then(db => db.query("SELECT * FROM downloads"));
    }

    getPendingDownloads() {
        return this.getDatabase().then(db => db.query("SELECT * FROM downloads WHERE uploaded IS NULL"));
    }

    markDownloadAsUploaded(download) {
        return this.getDatabase().then(db => db.query("UPDATE downloads SET uploaded = ? WHERE id = ?", new Date(), download.id));
    }

    getStreams() {
        return this.getDatabase().then(db => db.query(`SELECT * FROM streams`)).then(rows => {
            console.log(rows);
            return rows;
        });
    }

    _updateStream(station, status, name, index) {
        return this.getDatabase().then(db => db.query("SELECT id FROM streams WHERE station_id = ? AND name = ?", [station.id, name])).then(streamId => {
            if (streamId.length > 0) {
                const values = [status.streams[index].size, status.streams[index].block, new Date(), streamId[0]];
                return this.getDatabase().then(db => db.query(`UPDATE streams SET size = ?, last_block = ?, updated = ? WHERE id = ?`, values));
            }
            else {
                const values = [station.id, station.deviceId, name, status.streams[index].size, 0, status.streams[index].block, new Date()];
                return this.getDatabase().then(db => db.query(`INSERT INTO streams (station_id, device_id, name, size, first_block, last_block, updated) VALUES (?, ?, ?, ?, ?, ?, ?)`, values));
            }
        });
    }

    updateStationStatus(station, status) {
        return this.getDatabase().then(db => db.query("UPDATE stations SET status_json = ? WHERE id = ?", JSON.stringify(status), station.id)).then(() => {
            return this._updateStream(station, status, MetaStreamName, 1).then(() => {
                return this._updateStream(station, status, DataStreamName, 0);
            });
        });
    }

    getStationStatusByDeviceId(deviceId) {
        return this.getDatabase().then(db => db.query("SELECT status_json FROM stations WHERE device_id = ?", deviceId)).then(json => {
            return JSON.parse(json);
        });
    }

    getStationStatusById(id) {
        return this.getDatabase().then(db => db.query("SELECT status_json FROM stations WHERE id = ?", id)).then(json => {
            return JSON.parse(json);
        });
    }

    getDownloadsByStationId(id) {
        return this.getDatabase().then(db => db.query("SELECT * FROM downloads WHERE station_id = ?", [id]));
    }
}

class Station {
    constructor(_station) {
        // created_at, and updated_at will be generated
        this.deviceId = _station.deviceId;
        this.name = _station.name;
        this.url = _station.url ? _station.url : "no_url";
        this.status = _station.status;
        this.battery_level = _station.battery_level;
        this.available_memory = _station.available_memory;
        this.interval = Math.round(Math.random() * maxInterval + minInterval);
        this.connected = _station.connected ? _station.connected : 0;
    }
}
