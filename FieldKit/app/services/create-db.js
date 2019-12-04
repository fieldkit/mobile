import Config from "../config";
import Sqlite from "../wrappers/sqlite";

const sqlite = new Sqlite();

export default class CreateDB {
    constructor(dbInterface) {
        this.dbInterface = dbInterface;
    }

    initialize(userInvokedDelete) {
        return this.openDatabase()
            .then(() => {
                if (Config.dropTables || userInvokedDelete) {
                    return this.dropTables();
                } else {
                    return Promise.resolve(this.database);
                }
            })
            .then(this.createStationsTable.bind(this))
            .then(this.createModulesTable.bind(this))
            .then(this.createSensorsTable.bind(this))
            .then(this.createStationConfigLogTable.bind(this))
            .then(this.createModuleConfigLogTable.bind(this))
            .then(this.createDownloadsTable.bind(this))
            .then(this.createStreamsTable.bind(this))
            .then(this.createFieldNotesTable.bind(this))
            .then(this.createFieldMediaTable.bind(this))
            .then(() => {
                if (Config.seedDB) {
                    return this.seedDB();
                } else {
                    return Promise.resolve(this.database);
                }
            });
    }

    getDatabaseName() {
        if (TNS_ENV === "test") {
            return "test_fieldkit.sqlite3";
        }
        return "fieldkit.sqlite3";
    }

    openDatabase() {
        return sqlite.open(this.getDatabaseName()).then(db => {
            // foreign keys are disabled by default in sqlite
            // enable them here
            db.execute(`PRAGMA foreign_keys = ON;`);
            return (this.database = db);
        });
    }

    execute(sql) {
        let sqlArray = sql;
        if (!Array.isArray(sql)) {
            sqlArray = [sql];
        }
        return sqlArray.reduce((promise, item, index) => {
            return promise
                .then(() => {
                    return this.database.execute(item);
                })
                .then(
                    rv => {
                        return rv;
                    },
                    err => {
                        console.log("error executing", sql, err);
                    }
                );
        }, Promise.resolve(true));
    }

    dropTables() {
        return this.execute([
            `DROP TABLE IF EXISTS downloads`,
            `DROP TABLE IF EXISTS streams`,
            `DROP TABLE IF EXISTS stations_config`,
            `DROP TABLE IF EXISTS sensors`,
            `DROP TABLE IF EXISTS modules`,
            `DROP TABLE IF EXISTS fieldnotes`,
            `DROP TABLE IF EXISTS fieldmedia`,
            `DROP TABLE IF EXISTS stations`
        ]);
    }

    createStreamsTable() {
        return this.execute([
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
            `CREATE UNIQUE INDEX IF NOT EXISTS streams_idx ON streams (station_id, type)`
        ]);
    }

    createDownloadsTable() {
        return this.execute([
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
            )`
        ]);
    }

    createSensorsTable() {
        return this.execute([
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
            `CREATE INDEX IF NOT EXISTS sensor_module_idx ON sensors (module_id)`
        ]);
    }

    createModulesTable() {
        return this.execute([
            `CREATE TABLE IF NOT EXISTS modules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module_id TEXT,
                device_id TEXT,
                name TEXT,
                graphs TEXT,
                interval NUMERIC,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                station_id INTEGER,
                FOREIGN KEY(station_id) REFERENCES stations(id)
            )`,
            `CREATE UNIQUE INDEX IF NOT EXISTS modules_idx ON modules (device_id, module_id)`,
            `CREATE INDEX IF NOT EXISTS module_station_idx ON modules (station_id)`
        ]);
    }

    createStationsTable() {
        return this.execute([
            `CREATE TABLE IF NOT EXISTS stations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                status TEXT,
                battery_level NUMERIC,
                connected INTEGER,
                available_memory NUMERIC,
                interval NUMERIC,
                location_name TEXT,
                latitude NUMERIC,
                longitude NUMERIC,
                study_objective TEXT,
                location_purpose TEXT,
                site_criteria TEXT,
                site_description TEXT,
                deploy_start_time DATETIME,
                portal_id INTEGER,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                status_json TEXT
            )`,
            `CREATE UNIQUE INDEX IF NOT EXISTS stations_device_id_idx ON stations (device_id)`
        ]);
    }

    createFieldNotesTable() {
        return this.execute([
            `CREATE TABLE IF NOT EXISTS fieldnotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER,
                note TEXT,
                audio_file TEXT,
                category TEXT,
                author TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ]);
    }

    createFieldMediaTable() {
        return this.execute([
            `CREATE TABLE IF NOT EXISTS fieldmedia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER,
                image_name TEXT,
                image_label TEXT,
                category TEXT,
                author TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ]);
    }

    createStationConfigLogTable() {
        // Note: currently not enforcing foreign key constraints here,
        // in order to better persist tables
        return this.execute([
            `CREATE TABLE IF NOT EXISTS stations_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER,
                before TEXT,
                after TEXT,
                affected_field TEXT,
                author TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ]);
    }

    createModuleConfigLogTable() {
        return this.execute(
            `CREATE TABLE IF NOT EXISTS modules_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module_id INTEGER,
                before TEXT,
                after TEXT,
                affected_field TEXT,
                author TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        );
    }

    seedDB() {
        return Promise.all(stations.map(this.addStation.bind(this)))
                .then(this.handleModules.bind(this))
                .then(this.handleSensors.bind(this))
                .then(this.handleFieldNotes.bind(this))
                .then(this.handleFieldMedia.bind(this))
    }

    addStation(station) {
        // these numbers are only generated for seeded stations
        station.batteryLevel = Math.floor(Math.random() * Math.floor(100));
        station.availableMemory = Math.floor(Math.random() * Math.floor(100));
        station.longitude = -122.65397644042969;
        station.latitude = 45.500099182128906;
        station.deployStartTime = "";
        return this.dbInterface.insertStation(station).then(id => {
            station.id = id;
            station.modules.map(m => {
                m.stationId = station.id;
            });
            return;
        });
    }

    handleModules() {
        let modules = stations.map(s => {
            return s.modules;
        });
        modules = [].concat.apply([], modules);
        return Promise.all(modules.map(this.insertModule.bind(this)));
    }

    insertModule(module) {
        return this.dbInterface.insertModule(module).then(id => {
            module.id = id;
            module.sensors.map(s => {
                s.moduleId = module.id;
            });
            return;
        });
    }

    handleSensors() {
        let modules = stations.map(s => {
            return s.modules;
        });
        modules = [].concat.apply([], modules);
        let sensors = modules.map(m => {
            return m.sensors;
        });
        sensors = [].concat.apply([], sensors);
        return Promise.all(sensors.map(this.insertSensor.bind(this)));
    }

    insertSensor(sensor) {
        sensor.currentReading = this.generateReading(sensor.name);
        return this.dbInterface.insertSensor(sensor);
    }

    handleFieldNotes() {
        return Promise.all(fieldnotes.map(this.insertFieldNote.bind(this)));
    }

    insertFieldNote(note) {
        return this.dbInterface.insertFieldNote(note);
    }

    handleFieldMedia() {
        return Promise.all(fieldmedia.map(this.insertFieldMedia.bind(this)));
    }

    insertFieldMedia(media) {
        return this.dbInterface.insertFieldMedia(media);
    }

    generateReading(name) {
        let reading = 0;
        switch (name) {
            case "pH Sensor":
                reading = Math.random() * Math.floor(14);
                break;
            case "DO Sensor":
                reading = Math.random() * Math.floor(15);
                break;
            case "Conductivity Sensor":
            case "Conductivity":
                reading = Math.random() * Math.floor(20000);
                break;
            case "Temperature Sensor":
            case "Temperature":
                reading = Math.random() * Math.floor(200);
                break;
            case "Wind Sensor":
                reading = Math.random() * Math.floor(200);
                break;
            case "Rain Sensor":
                reading = Math.random() * Math.floor(10);
                break;
            case "Depth":
                reading = Math.random() * Math.floor(2000);
                break;
            default:
                reading = Math.random() * Math.floor(10);
        }
        return reading.toFixed(2);
    }
}

const stations = [
    {
        deviceId: "seeded-device-0",
        name: "Drammen Station",
        status: "idle",
        modules: [
            {
                moduleId: "seeded-device-0-module-0",
                deviceId: "seeded-device-0",
                name: "Water Module 1",
                sensors: [
                    {
                        name: "pH Sensor",
                        unitOfMeasure: "",
                        frequency: "60"
                    }
                ]
            },
            {
                moduleId: "seeded-device-0-module-1",
                deviceId: "seeded-device-0",
                name: "Water Module 2",
                sensors: [
                    {
                        name: "DO Sensor",
                        unitOfMeasure: "mg/L",
                        frequency: "60"
                    },
                    {
                        name: "Conductivity Sensor",
                        unitOfMeasure: "S/m",
                        frequency: "60"
                    }
                ]
            },
            {
                moduleId: "seeded-device-0-module-2",
                deviceId: "seeded-device-0",
                name: "Weather Module",
                sensors: [
                    {
                        name: "Temperature Sensor",
                        unitOfMeasure: "°C",
                        frequency: "60"
                    },
                    {
                        name: "Wind Sensor",
                        unitOfMeasure: "m/s",
                        frequency: "60"
                    },
                    {
                        name: "Rain Sensor",
                        unitOfMeasure: "mm/h",
                        frequency: "60"
                    }
                ]
            }
        ]
    },
    {
        deviceId: "seeded-device-1",
        name: "Eggjareid Station",
        status: "idle",
        modules: [
            {
                moduleId: "seeded-device-1-module-0",
                deviceId: "seeded-device-1",
                name: "Generic Module",
                sensors: [
                    {
                        name: "Configure Sensor",
                        unitOfMeasure: "",
                        frequency: "60"
                    }
                ]
            }
        ]
    },
    {
        deviceId: "seeded-device-2",
        name: "Evanger Station",
        status: "idle",
        modules: [
            {
                moduleId: "seeded-device-2-module-0",
                deviceId: "seeded-device-2",
                name: "Generic Module",
                sensors: [
                    {
                        name: "Configure Sensor",
                        unitOfMeasure: "",
                        frequency: "60"
                    }
                ]
            }
        ]
    },
    {
        deviceId: "seeded-device-3",
        name: "Finse Station",
        status: "idle",
        modules: [
            {
                moduleId: "seeded-device-3-module-0",
                deviceId: "seeded-device-3",
                name: "Generic Module",
                sensors: [
                    {
                        name: "Configure Sensor",
                        unitOfMeasure: "",
                        frequency: "60"
                    }
                ]
            }
        ]
    },
    {
        deviceId: "seeded-device-4",
        name: "Seeded Station #4",
        status: "idle",
        modules: [
            {
                moduleId: "seeded-device-4-module-0",
                deviceId: "seeded-device-4",
                name: "Generic Module",
                sensors: [
                    {
                        name: "Configure Sensor",
                        unitOfMeasure: "",
                        frequency: "60"
                    }
                ]
            }
        ]
    }
];

const fieldnotes = [
    {
        stationId: 1,
        note: "This study will help us understand weather patterns in our neighborhood.",
        audioFile: "",
        category: "default",
        author: "Test User"
    }
];

const fieldmedia = [
    {
        stationId: 1,
        imageName: "waterfall.jpg",
        imageLabel: "To the left of the waterfall",
        category: "default",
        author: "Test User"
    }
];
