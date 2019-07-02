import Config from "../config";
import QueryStation from "./query-station";
import Sqlite from "../wrappers/sqlite";

import DatabaseInterface from "./db-interface";
const dbInterface = new DatabaseInterface();

const queryStation = new QueryStation();
const sqlite = new Sqlite();

let databasePromise;
let foundStations = [];

export default class CreateDB {
    constructor() {
        databasePromise = this.openDatabase();
        this.databasePromise = databasePromise;
    }

    initialize() {
        return this.openDatabase()
            .then(() => {
                if (Config.dropTables) {
                    return this.dropTables();
                } else {
                    return Promise.resolve(this.database);
                }
            })
            .then(this.createSensorsTable.bind(this))
            .then(this.createModulesTable.bind(this))
            .then(this.createStationsTable.bind(this))
            .then(this.createConfigLogTable.bind(this))
            .then(() => {
                if (Config.seedDB) {
                    return dbInterface.insertIntoSensorsTable(sensors)
                        .then(dbInterface.insertIntoModulesTable(modules))
                        .then(dbInterface.insertIntoStationsTable(stations));
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
            return (this.database = db);
        });
    }

    dropTables() {
        return this.database.execute("DROP TABLE IF EXISTS modules")
            .then(this.database.execute("DROP TABLE IF EXISTS sensors"))
            .then(this.database.execute("DROP TABLE IF EXISTS stations"));
    }

    createSensorsTable() {
        return this.database.execute(
            "CREATE TABLE IF NOT EXISTS sensors (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                sensor_id TEXT, \
                module_id TEXT, \
                name TEXT, \
                unit TEXT, \
                currentReading NUMERIC, \
                frequency NUMERIC, \
                created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                updated DATETIME DEFAULT CURRENT_TIMESTAMP)"
        );
    }

    createModulesTable() {
        return this.database.execute(
            "CREATE TABLE IF NOT EXISTS modules (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                module_id TEXT, \
                device_id TEXT, \
                name TEXT, \
                sensors TEXT, \
                created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                updated DATETIME DEFAULT CURRENT_TIMESTAMP)"
        );
    }

    createStationsTable() {
        return this.database.execute(
            "CREATE TABLE IF NOT EXISTS stations (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                device_id TEXT, \
                name TEXT, \
                status TEXT, \
                batteryLevel NUMERIC, \
                connected TEXT, \
                availableMemory NUMERIC, \
                modules TEXT, \
                created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                updated DATETIME DEFAULT CURRENT_TIMESTAMP)"
        );
    }

    createConfigLogTable() {
        return this.database.execute(
            "CREATE TABLE IF NOT EXISTS config (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                device_id INTEGER, \
                before TEXT, \
                after TEXT, \
                affected_field TEXT, \
                author TEXT, \
                created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                updated DATETIME DEFAULT CURRENT_TIMESTAMP)"
        );
    }

    getSeededSensors() {
        return sensors;
    }

    getSeededModules() {
        return modules;
    }

    getSeededStations() {
        return stations;
    }
}

const sensors = [
    {
        sensorId: "seeded-device-0-module-0-sensor-0",
        moduleId: "seeded-device-0-module-0",
        name: "pH Sensor",
        unit: "",
        frequency: "60"
    },
    {
        sensorId: "seeded-device-0-module-1-sensor-0",
        moduleId: "seeded-device-0-module-1",
        name: "DO Sensor",
        unit: "mg/L",
        frequency: "60"
    },
    {
        sensorId: "seeded-device-0-module-1-sensor-1",
        moduleId: "seeded-device-0-module-1",
        name: "Conductivity Sensor",
        unit: "S/m",
        frequency: "60"
    },
    {
        sensorId: "seeded-device-0-module-2-sensor-0",
        moduleId: "seeded-device-0-module-2",
        name: "Temperature Sensor",
        unit: "°C",
        frequency: "60"
    },
    {
        sensorId: "seeded-device-0-module-2-sensor-1",
        moduleId: "seeded-device-0-module-2",
        name: "Wind Sensor",
        unit: "m/s",
        frequency: "60"
    },
    {
        sensorId: "seeded-device-0-module-2-sensor-2",
        moduleId: "seeded-device-0-module-2",
        name: "Rain Sensor",
        unit: "mm/h",
        frequency: "60"
    },
    {
        sensorId: "seeded-device-1-module-0-sensor-0",
        moduleId: "seeded-device-1-module-0",
        name: "Configure Sensor",
        unit: "",
        frequency: "60"
    },
    {
        sensorId: "seeded-device-2-module-0-sensor-0",
        moduleId: "seeded-device-2-module-0",
        name: "Configure Sensor",
        unit: "",
        frequency: "60"
    },
    {
        sensorId: "seeded-device-3-module-0-sensor-0",
        moduleId: "seeded-device-3-module-0",
        name: "Configure Sensor",
        unit: "",
        frequency: "60"
    },
    {
        sensorId: "seeded-device-4-module-0-sensor-0",
        moduleId: "seeded-device-4-module-0",
        name: "Configure Sensor",
        unit: "",
        frequency: "60"
    }
];

const modules = [
    {
        moduleId: "seeded-device-0-module-0",
        deviceId: "seeded-device-0",
        name: "Water Module 1",
        sensors: "seeded-device-0-module-0-sensor-0"
    },
    {
        moduleId: "seeded-device-0-module-1",
        deviceId: "seeded-device-0",
        name: "Water Module 2",
        sensors:
            "seeded-device-0-module-1-sensor-0,seeded-device-0-module-1-sensor-1"
    },
    {
        moduleId: "seeded-device-0-module-2",
        deviceId: "seeded-device-0",
        name: "Weather Module",
        sensors:
            "seeded-device-0-module-2-sensor-0,seeded-device-0-module-2-sensor-1,seeded-device-0-module-2-sensor-2"
    },
    {
        moduleId: "seeded-device-1-module-0",
        deviceId: "seeded-device-1",
        name: "Generic Module",
        sensors: "seeded-device-1-module-0-sensor-0"
    },
    {
        moduleId: "seeded-device-2-module-0",
        deviceId: "seeded-device-2",
        name: "Generic Module",
        sensors: "seeded-device-2-module-0-sensor-0"
    },
    {
        moduleId: "seeded-device-3-module-0",
        deviceId: "seeded-device-3",
        name: "Generic Module",
        sensors: "seeded-device-3-module-0-sensor-0"
    },
    {
        moduleId: "seeded-device-4-module-0",
        deviceId: "seeded-device-4",
        name: "Generic Module",
        sensors: "seeded-device-4-module-0-sensor-0"
    }
];

const stations = [
    {
        deviceId: "seeded-device-0",
        name: "Drammen Station",
        status: "Ready to deploy",
        modules:
            "seeded-device-0-module-0,seeded-device-0-module-1,seeded-device-0-module-2"
    },
    {
        deviceId: "seeded-device-1",
        name: "Eggjareid Station",
        status: "Deployed",
        modules: "seeded-device-1-module-0"
    },
    {
        deviceId: "seeded-device-2",
        name: "Evanger Station",
        status: "Deployed",
        modules: "seeded-device-2-module-0"
    },
    {
        deviceId: "seeded-device-3",
        name: "Finse Station",
        status: "Deployed",
        modules: "seeded-device-3-module-0"
    },
    {
        deviceId: "seeded-device-4",
        name: null,
        status: "Deployed",
        modules: "seeded-device-4-module-0"
    }
];
