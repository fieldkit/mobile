import _ from "lodash";
import Promise from "bluebird";
import Config from "../config";

export default class Fixtures {
    constructor(dbInterface) {
        this.dbInterface = dbInterface;
    }

    addMinimum() {
        return Promise.resolve();
    }

    addStationsAndModules() {
        return Promise.resolve([])
            .then(() => Promise.all(stations.map(this._addStation.bind(this))))
            .then(this._handleConfig.bind(this))
            .then(this._handleModules.bind(this))
            .then(this._handleSensors.bind(this))
            .then(this._handleFieldNotes.bind(this))
            .then(this._handleFieldMedia.bind(this));
    }

    _addStation(station) {
        // these numbers are only generated for seeded stations
        station.batteryLevel = Math.floor(Math.random() * Math.floor(100));
        station.totalMemory = 536870914; // 512 MB
        station.consumedMemory = Math.floor(Math.random() * 536870914);
        station.consumedMemoryPercent = Math.round((station.consumedMemory / station.totalMemory) * 100);
        station.longitude = -122.65397644042969;
        station.latitude = 45.500099182128906;
        station.deployStartTime = "";
        return this.dbInterface._insertStation(station).then((id) => {
            station.id = id;
            station.modules.map((m) => {
                m.stationId = station.id;
            });
            return station;
        });
    }

    _handleModules() {
        let modules = stations.map((s) => {
            return s.modules;
        });
        modules = [].concat.apply([], modules);
        return Promise.all(modules.map(this._insertModule.bind(this)));
    }

    _insertModule(module) {
        return this.dbInterface._insertModule(module).then((id) => {
            // module.id = id;
            module.sensors.map((s) => {
                s.moduleId = module.deviceId;
            });
            return module;
        });
    }

    _handleSensors() {
        let modules = stations.map((s) => {
            return s.modules;
        });
        modules = [].concat.apply([], modules);
        let sensors = modules.map((m) => {
            return m.sensors;
        });
        sensors = [].concat.apply([], sensors);
        return Promise.all(sensors.map(this._insertSensor.bind(this))).then((temp) => {
            return temp;
        });
    }

    _insertSensor(sensor) {
        sensor.currentReading = this._generateReading(sensor.name);
        return this.dbInterface
            .getDatabase()
            .then((db) => db.query("SELECT id FROM modules WHERE device_id = ?", [sensor.moduleId]))
            .then((id) => {
                const withModule = _.extend(sensor, {
                    moduleId: id[0].id,
                });
                return this.dbInterface._insertSensor(withModule);
            });
    }

    _handleFieldNotes() {
        return Promise.all(fieldnotes.map(this._insertFieldNote.bind(this)));
    }

    _insertFieldNote(note) {
        return this.dbInterface.insertFieldNote(note);
    }

    _handleFieldMedia() {
        return Promise.all(fieldmedia.map(this._insertFieldMedia.bind(this)));
    }

    _insertFieldMedia(media) {
        return this.dbInterface.insertFieldMedia(media);
    }

    _generateReading(name) {
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
        generationId: "seeded-device-0-generation-0",
        name: "Drammen Station",
        status: "idle",
        modules: [
            {
                moduleId: null,
                position: 1,
                deviceId: "seeded-module-0",
                name: "Water Module 1",
                sensors: [
                    {
                        name: "pH Sensor",
                        unitOfMeasure: "",
                        frequency: "60",
                    },
                ],
            },
            {
                moduleId: null,
                position: 2,
                deviceId: "seeded-module-1",
                name: "Water Module 2",
                sensors: [
                    {
                        name: "DO Sensor",
                        unitOfMeasure: "%",
                        frequency: "60",
                    },
                    {
                        name: "Conductivity Sensor",
                        unitOfMeasure: "S/m",
                        frequency: "60",
                    },
                ],
            },
            {
                moduleId: null,
                position: 3,
                deviceId: "seeded-module-2",
                name: "Weather Module",
                sensors: [
                    {
                        name: "Temperature Sensor",
                        unitOfMeasure: "°C",
                        frequency: "60",
                    },
                    {
                        name: "Wind Sensor",
                        unitOfMeasure: "m/s",
                        frequency: "60",
                    },
                    {
                        name: "Rain Sensor",
                        unitOfMeasure: "mm/h",
                        frequency: "60",
                    },
                ],
            },
        ],
    },
    {
        deviceId: "seeded-device-1",
        generationId: "seeded-device-1-generation-0",
        name: "Eggjareid Station",
        status: "idle",
        modules: [
            {
                moduleId: null,
                position: 1,
                deviceId: "seeded-module-3",
                name: "Generic Module",
                sensors: [
                    {
                        name: "Configure Sensor",
                        unitOfMeasure: "",
                        frequency: "60",
                    },
                ],
            },
        ],
    },
    {
        deviceId: "seeded-device-2",
        generationId: "seeded-device-2-generation-0",
        name: "Evanger Station",
        status: "idle",
        modules: [
            {
                moduleId: null,
                position: 1,
                deviceId: "seeded-module-4",
                name: "Generic Module",
                sensors: [
                    {
                        name: "Configure Sensor",
                        unitOfMeasure: "",
                        frequency: "60",
                    },
                ],
            },
        ],
    },
    {
        deviceId: "seeded-device-3",
        generationId: "seeded-device-3-generation-0",
        name: "Finse Station",
        status: "idle",
        modules: [
            {
                moduleId: null,
                position: 1,
                deviceId: "seeded-module-5",
                name: "Generic Module",
                sensors: [
                    {
                        name: "Configure Sensor",
                        unitOfMeasure: "",
                        frequency: "60",
                    },
                ],
            },
        ],
    },
    {
        deviceId: "seeded-device-4",
        generationId: "seeded-device-4-generation-0",
        name: "Seeded Station #4",
        status: "idle",
        modules: [
            {
                moduleId: null,
                position: 1,
                deviceId: "seeded-module-6",
                name: "Generic Module",
                sensors: [
                    {
                        name: "Configure Sensor",
                        unitOfMeasure: "",
                        frequency: "60",
                    },
                ],
            },
        ],
    },
];

const fieldnotes = [
    {
        stationId: 1,
        note: "This study will help us understand weather patterns in our neighborhood.",
        audioFile: "",
        category: "default",
        author: "Test User",
    },
];

const fieldmedia = [
    {
        stationId: 1,
        imageName: "waterfall.jpg",
        imageLabel: "To the left of the waterfall",
        category: "default",
        author: "Test User",
    },
];
