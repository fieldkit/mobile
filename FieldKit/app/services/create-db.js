import Config from "../config";
import QueryStation from "./query-station";
import Sqlite from "../wrappers/sqlite";

const queryStation = new QueryStation();
const sqlite = new Sqlite();

let databasePromise;

export default class CreateDB {
    constructor() {
        if (databasePromise == null) {
            databasePromise = this.openDatabase()
                .then(() => {
                    if(Config.dropTables) {
                        return Promise.resolve().then(this.dropTables.bind(this));
                    } else {
                        return Promise.resolve(this.database);
                    }
                })
                .then(this.createSensorsTable.bind(this))
                .then(this.createModulesTable.bind(this))
                .then(this.createStationsTable.bind(this))
                .then(this.createConfigLogTable.bind(this))
                .then(this.checkForStation.bind(this))
                .then(() => {
                    if(Config.seedDB) {
                        return Promise.resolve().then(this.insertIntoSensorsTable.bind(this, sensors))
                            .then(this.insertIntoModulesTable.bind(this, modules))
                            .then(this.insertIntoStationsTable.bind(this, stations))
                    } else {
                        return Promise.resolve(this.database);
                    }
                });
        }
        this.databasePromise = databasePromise;
    }

    getDatabaseName() {
        if (TNS_ENV === "test") {
            return ":memory:";
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

    dropTables() {
        return Promise.resolve()
            .then(() => {
                return this.database.execute("DROP TABLE IF EXISTS modules");
            })
            .then(() => {
                return this.database.execute("DROP TABLE IF EXISTS sensors");
            })
            .then(() => {
                return this.database.execute("DROP TABLE IF EXISTS stations");
            });
    }

    checkForStation() {
        // let address = "https://localhost:2382";
        let address = "http://192.168.1.5:2380";
        let thisDB = this;

        return new Promise(function(resolve, reject) {
            let result = queryStation.queryIdentity(address);
            return result.then(r => {
                resolve(r.identity)
            }).catch(e => {
                resolve();
            })
        }).then(function(identity) {
            if(!identity) {Promise.resolve(thisDB.database); return}
            let result = queryStation.queryCapabilities(address);
            return result.then(r => {
                return thisDB.addStation(identity, r.capabilities);
            }).catch(e => {
                Promise.resolve(thisDB.database);
            })
        });
    }

    addStation(identity, capabilities) {
        let name = identity.device;
        let id = identity.deviceId;
        let result = [];
        for (let i = 0; i < id.length; i++) {
            result.push(id[i]);
        }
        let deviceId = result.join("-");
        let station = {"deviceId": deviceId, "name": name, "status": "Ready to deploy", "modules": ""};
        let generateReading = this.generateReading;

        let newModules = [];
        let newSensors = [];
        capabilities.modules.forEach(function(m,i) {
            let moduleId = deviceId + "-module-" + i;
            let mod = {"moduleId": moduleId, "deviceId": deviceId, "name": m.name, "sensors": ""};
            let modSensors = capabilities.sensors.filter(function(s) {return s.module == m.id;});
            modSensors.forEach(function(s,j) {
                let sensorId = moduleId + "-sensor-" + j;
                mod.sensors += j == 0 ? sensorId : "," + sensorId;
                let sensor = {"sensorId": sensorId, "moduleId": moduleId, "name": s.name, "unit": s.unitOfMeasure, "frequency": s.frequency};
                sensor.currentReading = generateReading(sensor.name);
                newSensors.push(sensor);
            });
            newModules.push(mod);
            station.modules += i == 0 ? moduleId : "," + moduleId;
        });

        return Promise.resolve().then(this.insertIntoSensorsTable.bind(this, newSensors))
            .then(this.insertIntoModulesTable.bind(this, newModules))
            .then(this.insertIntoStationsTable.bind(this, [station]));
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

    insertIntoSensorsTable(sensorsToInsert) {
        let result = sensorsToInsert.reduce((previousPromise, nextSensor) => {
            nextSensor.currentReading = this.generateReading(nextSensor.name);
            return previousPromise.then(() => {
                return this.database.execute(
                    "INSERT INTO sensors (sensor_id, module_id, name, unit, frequency, currentReading) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        nextSensor.sensorId,
                        nextSensor.moduleId,
                        nextSensor.name,
                        nextSensor.unit,
                        nextSensor.frequency,
                        nextSensor.currentReading
                    ]
                );
            });
        }, Promise.resolve());

        return result;
    }

    insertIntoModulesTable(modulesToInsert) {
        let result = modulesToInsert.reduce((previousPromise, nextModule) => {
            return previousPromise.then(() => {
                return this.database.execute(
                    "INSERT INTO modules (module_id, device_id, name, sensors) VALUES (?, ?, ?, ?)",
                    [nextModule.moduleId, nextModule.deviceId, nextModule.name, nextModule.sensors]
                );
            });
        }, Promise.resolve());

        return result;
    }

    insertIntoStationsTable(stationsToInsert) {
        let result = stationsToInsert.reduce((previousPromise, nextStn) => {
            let newStation = new Station(nextStn);
            return previousPromise.then(() => {
                return this.database.execute(
                    "INSERT INTO stations (device_id, name, status, batteryLevel, connected, availableMemory, modules) \
                    VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [
                        newStation.deviceId,
                        newStation.name,
                        newStation.status,
                        newStation.batteryLevel,
                        newStation.connected,
                        newStation.availableMemory,
                        newStation.modules
                    ]
                );
            });
        }, Promise.resolve());

        return result;
    }
}

class Station {
    constructor(_station) {
        // created_at, and updated_at will be generated
        this.deviceId = _station.deviceId;
        this.name = _station.name
            ? _station.name
            : "FieldKit Station " +
              Math.floor(Math.random() * Math.floor(9000));
        this.status = _station.status;
        this.batteryLevel = Math.floor(Math.random() * Math.floor(100));
        this.connected = "true";
        this.availableMemory = Math.floor(Math.random() * Math.floor(100));
        this.modules = _station.modules; // comma-delimited list of module ids
    }
}

const sensors = [
    {"sensorId": "seeded-device-0-module-0-sensor-0", "moduleId": "seeded-device-0-module-0", "name": "pH Sensor", "unit": "", "frequency": "60" },
    {"sensorId": "seeded-device-0-module-1-sensor-0", "moduleId": "seeded-device-0-module-1", "name": "DO Sensor", "unit": "mg/L", "frequency": "60" },
    {"sensorId": "seeded-device-0-module-1-sensor-1", "moduleId": "seeded-device-0-module-1", "name": "Conductivity Sensor", "unit": "S/m", "frequency": "60" },
    {"sensorId": "seeded-device-0-module-2-sensor-0", "moduleId": "seeded-device-0-module-2", "name": "Temperature Sensor", "unit": "°C", "frequency": "60" },
    {"sensorId": "seeded-device-0-module-2-sensor-1", "moduleId": "seeded-device-0-module-2", "name": "Wind Sensor", "unit": "m/s", "frequency": "60" },
    {"sensorId": "seeded-device-0-module-2-sensor-2", "moduleId": "seeded-device-0-module-2", "name": "Rain Sensor", "unit": "mm/h", "frequency": "60" },
    {"sensorId": "seeded-device-1-module-0-sensor-0", "moduleId": "seeded-device-1-module-0", "name": "Configure Sensor", "unit": "", "frequency": "60" },
    {"sensorId": "seeded-device-2-module-0-sensor-0", "moduleId": "seeded-device-2-module-0", "name": "Configure Sensor", "unit": "", "frequency": "60" },
    {"sensorId": "seeded-device-3-module-0-sensor-0", "moduleId": "seeded-device-3-module-0", "name": "Configure Sensor", "unit": "", "frequency": "60" },
    {"sensorId": "seeded-device-4-module-0-sensor-0", "moduleId": "seeded-device-4-module-0", "name": "Configure Sensor", "unit": "", "frequency": "60" }
];

const modules = [
    {"moduleId": "seeded-device-0-module-0", "deviceId": "seeded-device-0", "name": "Water Module 1", "sensors": "seeded-device-0-module-0-sensor-0"},
    {"moduleId": "seeded-device-0-module-1", "deviceId": "seeded-device-0", "name": "Water Module 2", "sensors": "seeded-device-0-module-1-sensor-0,seeded-device-0-module-1-sensor-1"},
    {"moduleId": "seeded-device-0-module-2", "deviceId": "seeded-device-0", "name": "Weather Module", "sensors": "seeded-device-0-module-2-sensor-0,seeded-device-0-module-2-sensor-1,seeded-device-0-module-2-sensor-2"},
    {"moduleId": "seeded-device-1-module-0", "deviceId": "seeded-device-1", "name": "Generic Module", "sensors": "seeded-device-1-module-0-sensor-0"},
    {"moduleId": "seeded-device-2-module-0", "deviceId": "seeded-device-2", "name": "Generic Module", "sensors": "seeded-device-2-module-0-sensor-0"},
    {"moduleId": "seeded-device-3-module-0", "deviceId": "seeded-device-3", "name": "Generic Module", "sensors": "seeded-device-3-module-0-sensor-0"},
    {"moduleId": "seeded-device-4-module-0", "deviceId": "seeded-device-4", "name": "Generic Module", "sensors": "seeded-device-4-module-0-sensor-0"}
];

const stations = [
    {"deviceId": "seeded-device-0", "name": "Drammen Station", "status": "Ready to deploy", "modules": "seeded-device-0-module-0,seeded-device-0-module-1,seeded-device-0-module-2"},
    {"deviceId": "seeded-device-1", "name": "Eggjareid Station", "status": "Deployed", "modules": "seeded-device-1-module-0"},
    {"deviceId": "seeded-device-2", "name": "Evanger Station", "status": "Deployed", "modules": "seeded-device-2-module-0"},
    {"deviceId": "seeded-device-3", "name": "Finse Station", "status": "Deployed", "modules": "seeded-device-3-module-0"},
    {"deviceId": "seeded-device-4", "name": null, "status": "Deployed", "modules": "seeded-device-4-module-0"},
];
