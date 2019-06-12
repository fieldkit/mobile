import Sqlite from '../wrappers/sqlite';

const sqlite = new Sqlite();

let databasePromise;

export default class CreateDB {
    constructor() {
        this.createdSensors = [];
        this.createdModules = [];
        if (databasePromise == null) {
            databasePromise = this.openDatabase()
                .then(this.dropTables.bind(this))
                .then(this.createSensorsTable.bind(this))
                .then(this.seedSensorsTable.bind(this))
                .then(this.createModulesTable.bind(this))
                .then(this.seedModulesTable.bind(this))
                .then(this.createStationsTable.bind(this))
                .then(this.seedStationsTable.bind(this));
        }
        this.databasePromise = databasePromise;
    }

    getDatabaseName() {
        if (TNS_ENV === 'test') {
            return ":memory:";
        }
        return "fieldkit.sqlite3";
    }

    openDatabase() {
        return sqlite.open(this.getDatabaseName()).then(db => {
            return this.database = db;
        });
    }

    getDatabase() {
        return databasePromise;
    }

    dropTables() {
        return Promise.resolve().then(() => {
            return this.database.execute("DROP TABLE IF EXISTS modules");
        }).then(() => {
            return this.database.execute("DROP TABLE IF EXISTS sensors");
        }).then(() => {
            return this.database.execute("DROP TABLE IF EXISTS stations");
        });
    }

    createSensorsTable() {
        return this.database.execute(
            "CREATE TABLE IF NOT EXISTS sensors (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                name TEXT, \
                unit TEXT, \
                currentReading NUMERIC, \
                created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                updated DATETIME DEFAULT CURRENT_TIMESTAMP)");
    }

    createModulesTable() {
        return this.database.execute(
            "CREATE TABLE IF NOT EXISTS modules (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                name TEXT, \
                sensors TEXT, \
                created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                updated DATETIME DEFAULT CURRENT_TIMESTAMP)");
    }

    createStationsTable() {
        return this.database.execute(
            "CREATE TABLE IF NOT EXISTS stations (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                name TEXT, \
                status TEXT, \
                batteryLevel NUMERIC, \
                connected TEXT, \
                availableMemory NUMERIC, \
                modules TEXT, \
                created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                updated DATETIME DEFAULT CURRENT_TIMESTAMP)");
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
            this.createdSensors.push({name: nextSensor.name, id: i+1});
            return previousPromise.then(() => {
                return this.database.execute("INSERT INTO sensors (name, unit, currentReading) VALUES (?, ?, ?)", [nextSensor.name, nextSensor.unit, nextSensor.currentReading]);
            });
        }, Promise.resolve());

        return result;
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
        names.forEach((n) => {
            let mod = new Module(n);
            moduleSensors[n].forEach((sensorName) => {
                let sensor = this.createdSensors.find(function(c) {
                    return c.name == sensorName;
                });
                mod.sensors += mod.sensors == "" ? sensor.id : ","+sensor.id;
            });
            modules.push(mod);
        });

        let result = modules.reduce( (previousPromise, nextModule, i) => {
            // kludge alert - hard-coding the ids to match sqlite ids
            this.createdModules.push({name: nextModule.name, id: i+1});
            return previousPromise.then(() => {
                return this.database.execute("INSERT INTO modules (name, sensors) VALUES (?, ?)", [nextModule.name, nextModule.sensors]);
            });
        }, Promise.resolve() );

        return result;
    }

    seedStationsTable() {
        const names = ["Drammen Station", "Eggjareid Station", "Evanger Station", "Finse Station", null];
        let stations = [];
        names.forEach((n,i) => {
            let station = new Station(n);
            if(i == 0) {
                station.status = "Ready to deploy";
                // give the first station all the modules
                this.createdModules.forEach(function(m) {
                    station.modules += station.modules == "" ? m.id : ","+m.id;
                });
            } else {
                station.status = "Deployed";
                // other stations get generic module
                let mod = this.createdModules.find(function(m) {
                    return m.name == "Generic Module";
                });
                station.modules = mod.id;
            }
            stations.push(station);
        });

        let result = stations.reduce( (previousPromise, nextStn) => {
            return previousPromise.then(() => {
                return this.database.execute(
                    "INSERT INTO stations (name, status, batteryLevel, connected, availableMemory, modules) \
                    VALUES (?, ?, ?, ?, ?, ?)",
                    [nextStn.name, nextStn.status, nextStn.batteryLevel, nextStn.connected, nextStn.availableMemory, nextStn.modules]);
            });
        }, Promise.resolve() );

        return result;
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
