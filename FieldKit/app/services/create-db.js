import Sqlite from '../wrappers/sqlite';
const sqlite = new Sqlite();

let createdSensors = [];
let createdModules = [];
let database = "";

export default class CreateDB {
    constructor() {
        if(!this.checkForDB()) {
            this.createSensorsTable()
                .then(this.seedSensorsTable)
                .then(this.createModulesTable)
                .then(this.seedModulesTable)
                .then(this.createStationsTable)
                .then(this.seedStationsTable);
        }
    }

    checkForDB() {
        sqlite.deleteDatabase("FieldKitStations");
        return sqlite.exists("FieldKitStations");
    }

    createSensorsTable() {
        return sqlite.open("FieldKitStations")
            .then(db => {
                if(db.isOpen()) {
                    database = db;
                    // new db, create table
                    return db.execSQL(
                        "CREATE TABLE IF NOT EXISTS sensors (\
                            id INTEGER PRIMARY KEY AUTOINCREMENT, \
                            name TEXT, \
                            unit TEXT, \
                            currentReading NUMERIC, \
                            created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                            updated DATETIME DEFAULT CURRENT_TIMESTAMP)")
                }
            }, error => {
                // console.log("Failed to open database", error);
            });
    }

    createModulesTable() {
        return database.execSQL(
            "CREATE TABLE IF NOT EXISTS modules (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                name TEXT, \
                sensors TEXT, \
                created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                updated DATETIME DEFAULT CURRENT_TIMESTAMP)")
    }

    createStationsTable() {
        return database.execSQL(
            "CREATE TABLE IF NOT EXISTS stations (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                name TEXT, \
                status TEXT, \
                batteryLevel NUMERIC, \
                connected TEXT, \
                availableMemory NUMERIC, \
                modules TEXT, \
                created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                updated DATETIME DEFAULT CURRENT_TIMESTAMP)")
    }

    seedSensorsTable() {
        const sensorTypes = [
            {"name": "pH Sensor", "unit" : ""},
            {"name": "DO Sensor", "unit" : "mg/L"},
            {"name": "Conductivity Sensor", "unit" : "S/m"},
            {"name": "Temperature Sensor", "unit" : "°C"},
            {"name": "Wind Sensor", "unit" : "m/s"},
            {"name": "Rain Sensor", "unit" : "mm/h"},
            {"name": "Configure Sensor", "unit" : ""},
        ];
        let sensors = [];
        sensorTypes.forEach(function(s) {
            sensors.push(new Sensor(s.name, s.unit));
        });

        let result = sensors.reduce( (previousPromise, nextSensor, i) => {
            // kludge alert - hard-coding the ids to match sqlite ids
            createdSensors.push({name: nextSensor.name, id: i+1});
            return previousPromise.then(() => {
                return database.execSQL("INSERT INTO sensors (name, unit, currentReading) VALUES (?, ?, ?)", [nextSensor.name, nextSensor.unit, nextSensor.currentReading]);
            });
        }, Promise.resolve() );

        return result.then(e => {
          return Promise.resolve();
        });
    }

    seedModulesTable() {
        const names = ["Water Module 1", "Water Module 2", "Weather Module", "Generic Module"];
        const moduleSensors = {
            "Water Module 1": ["pH Sensor"],
            "Water Module 2": ["DO Sensor", "Conductivity Sensor"],
            "Weather Module": ["Temperature Sensor", "Wind Sensor", "Rain Sensor"],
            "Generic Module": ["Configure Sensor"]
        };
        let modules = [];
        names.forEach(function(n) {
            let mod = new Module(n);
            moduleSensors[n].forEach(function(sensorName) {
                let sensor = createdSensors.find(function(c) {
                    return c.name == sensorName;
                });
                mod.sensors += mod.sensors == "" ? sensor.id : ","+sensor.id;
            });
            modules.push(mod);
        });

        let result = modules.reduce( (previousPromise, nextModule, i) => {
            // kludge alert - hard-coding the ids to match sqlite ids
            createdModules.push({name: nextModule.name, id: i+1});
            return previousPromise.then(() => {
                return database.execSQL("INSERT INTO modules (name, sensors) VALUES (?, ?)", [nextModule.name, nextModule.sensors]);
            });
        }, Promise.resolve() );

        return result.then(e => {
          return Promise.resolve();
        });
    }

    seedStationsTable() {
        const names = ["Drammen Station", "Eggjareid Station", "Evanger Station", "Finse Station", null];
        let stations = [];
        names.forEach(function(n,i) {
            let station = new Station(n);
            if(i == 0) {
                station.status = "Ready to deploy";
                // give the first station all the modules
                createdModules.forEach(function(m) {
                    station.modules += station.modules == "" ? m.id : ","+m.id;
                })
            } else {
                station.status = "Deployed";
                // other stations get generic module
                let mod = createdModules.find(function(m) {
                    return m.name == "Generic Module";
                });
                station.modules = mod.id;
            }
            stations.push(station);
        })

        let result = stations.reduce( (previousPromise, nextStn) => {
            return previousPromise.then(() => {
                return database.execSQL(
                    "INSERT INTO stations (name, status, batteryLevel, connected, availableMemory, modules) \
                    VALUES (?, ?, ?, ?, ?, ?)",
                    [nextStn.name, nextStn.status, nextStn.batteryLevel, nextStn.connected, nextStn.availableMemory, nextStn.modules]);
            });
        }, Promise.resolve() );

        result.then(e => {
          database.close();
        });
    }
}

class Sensor {
    constructor(name, unit) {
        // id, created_at, and updated_at will be generated
        this.name = name;
        this.unit = unit;
        this.currentReading = this.generateReading(name);
    }

    generateReading(name) {
        let reading = 0;
        switch (name) {
            case 'pH Sensor':
                reading = Math.random() * Math.floor(14);
                break;
            case 'DO Sensor':
                reading = Math.random() * Math.floor(15);
                break;
            case 'Conductivity Sensor':
                reading = Math.random() * Math.floor(20000);
                break;
            case 'Temperature Sensor':
                reading = Math.random() * Math.floor(200);
                break;
            case 'Wind Sensor':
                reading = Math.random() * Math.floor(200);
                break;
            case 'Rain Sensor':
                reading = Math.random() * Math.floor(10);
                break;
            default:
                reading = Math.random() * Math.floor(10);
        }
        return reading.toFixed(2);
    }
}

class Module {
    constructor(name) {
        // id, created_at, and updated_at will be generated
        this.name = name;
        this.sensors = ""; // comma-delimted list of sensor ids
    }
}

class Station {
    constructor(name) {
        // id, created_at, and updated_at will be generated
        this.name = name ? name : "FieldKit Station "+Math.floor(Math.random() * Math.floor(9000));
        this.status = "";
        this.batteryLevel = Math.floor(Math.random() * Math.floor(100));
        this.connected = "true";
        this.availableMemory = Math.floor(Math.random() * Math.floor(100));
        this.modules = ""; // comma-delimited list of module ids
    }
}

