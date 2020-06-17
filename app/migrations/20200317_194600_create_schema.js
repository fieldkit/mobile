import _ from "lodash";
import Migration from "./Migration";

export class CreateSchema_20200317_194600 extends Migration {
    up(db) {
        return db.batch(
            _.flatten([
                this.configTable(),
                this.firmwareTable(),
                this.streamsTable(),
                this.downloadsTable(),
                this.sensorsTable(),
                this.modulesTable(),
                this.stationsTable(),
                this.fieldNotesTable(),
                this.fieldMediaTable(),
                this.stationConfigLogTable(),
                this.moduleConfigLogTable(),
            ])
        );
    }

    configTable() {
        return [
            `CREATE TABLE IF NOT EXISTS config (
                id INTEGER PRIMARY KEY,
                base_uri TEXT,
                ingestion_uri TEXT
            )`,
        ];
    }

    firmwareTable() {
        return [
            `CREATE TABLE IF NOT EXISTS firmware (
                id INTEGER PRIMARY KEY,
                time TIMESTAMP NOT NULL,
                url TEXT NOT NULL,
                module TEXT NOT NULL,
                profile TEXT NOT NULL,
                etag TEXT NOT NULL,
                path TEXT NOT NULL
            )`,
        ];
    }

    streamsTable() {
        return [
            `CREATE TABLE IF NOT EXISTS streams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER NOT NULL,
                device_id TEXT NOT NULL,
                type TEXT NOT NULL,
                device_size INTEGER NOT NULL,
                device_first_block INTEGER NOT NULL,
                device_last_block INTEGER NOT NULL,
                download_size INTEGER,
                download_first_block INTEGER,
                download_last_block INTEGER,
                portal_size INTEGER,
                portal_first_block INTEGER,
                portal_last_block INTEGER,
                updated TIMESTAMP NOT NULL,
                FOREIGN KEY(station_id) REFERENCES stations(id)
            )`,
            `CREATE UNIQUE INDEX IF NOT EXISTS streams_idx ON streams (station_id, type)`,
        ];
    }

    downloadsTable() {
        return [
            `CREATE TABLE IF NOT EXISTS downloads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER NOT NULL,
                device_id TEXT NOT NULL,
                type TEXT NOT NULL,
                path TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                url TEXT NOT NULL,
                size INTEGER NOT NULL,
                blocks TEXT NOT NULL,
                generation TEXT NOT NULL,
                first_block INTEGER NOT NULL,
                last_block INTEGER NOT NULL,
                uploaded TIMESTAMP,
                FOREIGN KEY(station_id) REFERENCES stations(id)
            )`,
        ];
    }

    sensorsTable() {
        return [
            `CREATE TABLE IF NOT EXISTS sensors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                unit TEXT,
                current_reading NUMERIC,
                frequency NUMERIC,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                module_id INTEGER,
                FOREIGN KEY(module_id) REFERENCES modules(id)
            )`,
            `CREATE INDEX IF NOT EXISTS sensor_module_idx ON sensors (module_id)`,
        ];
    }

    modulesTable() {
        // Note: device_id is the module's unique hardware id (not the station's)
        return [
            `CREATE TABLE IF NOT EXISTS modules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module_id TEXT,
                device_id TEXT,
                name TEXT,
                graphs TEXT,
                interval NUMERIC,
                position NUMERIC,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                station_id INTEGER,
                FOREIGN KEY(station_id) REFERENCES stations(id)
            )`,
            `CREATE UNIQUE INDEX IF NOT EXISTS modules_idx ON modules (device_id, module_id)`,
            `CREATE INDEX IF NOT EXISTS module_station_idx ON modules (station_id)`,
        ];
    }

    stationsTable() {
        return [
            `CREATE TABLE IF NOT EXISTS stations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                generation_id TEXT NOT NULL,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                status TEXT,
                battery_level NUMERIC,
                connected INTEGER,
                consumed_memory_percent NUMERIC,
                consumed_memory NUMERIC,
                total_memory NUMERIC,
                interval NUMERIC,
                location_name TEXT,
                latitude NUMERIC,
                longitude NUMERIC,
                study_objective TEXT,
                location_purpose TEXT,
                site_criteria TEXT,
                site_description TEXT,
                deploy_start_time DATETIME,
                percent_complete INTEGER,
                portal_id INTEGER,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME,
                status_json TEXT
            )`,
            `CREATE UNIQUE INDEX IF NOT EXISTS stations_device_id_idx ON stations (device_id)`,
        ];
    }

    fieldNotesTable() {
        return [
            `CREATE TABLE IF NOT EXISTS fieldnotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER,
                generation_id TEXT,
                note TEXT,
                title TEXT,
                audio_file TEXT,
                category TEXT,
                author TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
        ];
    }

    fieldMediaTable() {
        return [
            `CREATE TABLE IF NOT EXISTS fieldmedia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER,
                generation_id TEXT,
                image_name TEXT,
                image_label TEXT,
                category TEXT,
                author TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
        ];
    }

    stationConfigLogTable() {
        return [
            `CREATE TABLE IF NOT EXISTS stations_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER,
                before TEXT,
                after TEXT,
                affected_field TEXT,
                author TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
        ];
    }

    moduleConfigLogTable() {
        return [
            `CREATE TABLE IF NOT EXISTS modules_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module_id INTEGER,
                before TEXT,
                after TEXT,
                affected_field TEXT,
                author TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
        ];
    }
}
