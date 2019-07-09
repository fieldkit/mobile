import Config from "../config";
import QueryStation from "./query-station";
import Sqlite from "../wrappers/sqlite";

const queryStation = new QueryStation();
const sqlite = new Sqlite();

let databasePromise;

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

    getConfigs(deviceId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM config WHERE device_id=" + deviceId)
        );
    }

    getDatabase() {
        return this.databasePromise;
    }

    getAll() {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM stations")
        );
    }

    getStation(deviceId) {
        return this.getDatabase().then(db =>
            db.query(
                "SELECT * FROM stations WHERE device_id='" + deviceId + "'"
            )
        );
    }

    getModules(deviceId) {
        return this.getDatabase().then(db =>
            db.query(
                "SELECT * FROM modules WHERE device_id IN ('" + deviceId + "')"
            )
        );
    }

    getSensors(moduleId) {
        return this.getDatabase().then(db =>
            db.query(
                "SELECT * FROM sensors WHERE module_id IN ('" + moduleId + "')"
            )
        );
    }

    setStationName(station) {
        return this.getDatabase().then(db =>
            db.query(
                "UPDATE stations SET name='" +
                    station.name +
                    "' WHERE id=" +
                    station.id
            )
        );
    }

    recordConfigChange(config) {
        return this.getDatabase().then(db =>
            db.query(
                "INSERT INTO config (device_id, before, after, affected_field, author) VALUES (?, ?, ?, ?, ?)",
                [
                    config.device_id,
                    config.before,
                    config.after,
                    config.affected_field,
                    config.author
                ]
            )
        );
    }

    checkForStation(address) {
        // let address = "https://localhost:2382";
        // let address = "http://192.168.1.5:2380";
        queryStation.queryIdentity(address).then(idResult => {
            queryStation.queryCapabilities(address).then(capResult => {
                let id = idResult.identity.deviceId;
                let result = [];
                for (let i = 0; i < id.length; i++) {
                    result.push(id[i]);
                }
                let deviceId = result.join("-");
                // check to see if we already have it - and
                // TO DO: update it?
                this.database
                    .query(
                        "SELECT * FROM stations WHERE device_id='" +
                            deviceId +
                            "'"
                    )
                    .then(result => {
                        if (result.length > 0) {
                            // already have this station in db - update?
                        } else {
                            this.addStation(
                                deviceId,
                                address,
                                idResult.identity.device,
                                capResult.capabilities
                            );
                        }
                    });
            });
        });
    }

    addStation(deviceId, address, deviceName, capabilities) {
        let station = {
            deviceId: deviceId,
            name: deviceName,
            url: address,
            status: "Ready to deploy",
            modules: ""
        };
        let generateReading = this.generateReading;

        let newModules = [];
        let newSensors = [];
        capabilities.modules.forEach(function(m, i) {
            let moduleId = deviceId + "-module-" + i;
            let mod = {
                moduleId: moduleId,
                deviceId: deviceId,
                name: m.name,
                sensors: ""
            };
            let modSensors = capabilities.sensors.filter(function(s) {
                return s.module == m.id;
            });
            modSensors.forEach(function(s, j) {
                let sensorId = moduleId + "-sensor-" + j;
                mod.sensors += j == 0 ? sensorId : "," + sensorId;
                let sensor = {
                    sensorId: sensorId,
                    moduleId: moduleId,
                    name: s.name,
                    unit: s.unitOfMeasure,
                    frequency: s.frequency
                };
                sensor.currentReading = generateReading(sensor.name);
                newSensors.push(sensor);
            });
            newModules.push(mod);
            station.modules += i == 0 ? moduleId : "," + moduleId;
        });

        this.insertIntoStationsTable([station])
            .then(this.insertIntoModulesTable(newModules))
            .then(this.insertIntoSensorsTable(newSensors));
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
                    [
                        nextModule.moduleId,
                        nextModule.deviceId,
                        nextModule.name,
                        nextModule.sensors
                    ]
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
                    "INSERT INTO stations (device_id, name, url, status, batteryLevel, connected, availableMemory, modules) \
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        newStation.deviceId,
                        newStation.name,
                        newStation.url,
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
        this.url = _station.url ? _station.url : "no_url";
        this.status = _station.status;
        this.batteryLevel = Math.floor(Math.random() * Math.floor(100));
        this.connected = "true";
        this.availableMemory = Math.floor(Math.random() * Math.floor(100));
        this.modules = _station.modules; // comma-delimited list of module ids
    }
}
