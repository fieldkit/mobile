import { Observable } from "tns-core-modules/data/observable";

const pastDate = new Date(2000, 0, 1);

function is_internal_module(module) {
    return module.flags & 1; // TODO Pull this enum in from the protobuf file.
}

export default class StationMonitor extends Observable {
    constructor(discoverStation, dbInterface, queryStation) {
        super();
        this.dbInterface = dbInterface;
        this.queryStation = queryStation;
        this.stations = {};
        this.discoverStation = discoverStation;
        this.subscribeToStationDiscovery();
        this.dbInterface.getAll().then(this.initializeStations.bind(this));
        return this;
    }

    initializeStations(result) {
        const thisMonitor = this;
        result.map(r => {
            r.type = "no_url";
            let key = thisMonitor.makeKey(r);
            r.lastSeen = r.connected ? new Date() : pastDate;
            thisMonitor.stations[key] = r;
            if (r.url != "no_url") {
                // first try, might not have a reading yet
                this.queryStation.queryTakeReadings(r.url);
            }
        });

        // start ten second cycle
        this.intervalTimer = setInterval(() => {
            this.queryStations();
        }, 10000);
    }

    getStations() {
        return this.sortStations();
    }

    queryStations() {
        Object.values(this.stations).forEach(station => {
            if (station.url == "no_url") {
                return;
            }
            const elapsed = new Date() - station.lastSeen;
            // if station hasn't been heard from in over a minute, disable it
            // (seeded stations exempt for now due to above return statement)
            if (elapsed > 60000 && station.lastSeen != pastDate) {
                this.deactivateStation(station);
            }
            this.queryStation.queryTakeReadings(station.url).then(this.updateStationReadings.bind(this, station));
        });
    }

    updateStationReadings(station, result) {
        if (result.errors.length > 0 || station.name != result.status.identity.device) {
            return;
        }
        station.lastSeen = new Date();
        const readings = {};
        result.liveReadings.forEach(lr => {
            lr.modules.forEach(m => {
                m.readings.forEach(r => {
                    // console.log("update db?", m.module.name, r.sensor.name, r.value);
                    readings[m.module.name + r.sensor.name] = r.value;
                });
            });
        });
        let data = {
            stationId: station.id,
            readings: readings,
            batteryLevel: result.status.power.battery.percentage,
            consumedMemory: result.status.memory.dataMemoryConsumption
        };
        this.notifyPropertyChange("readingsChanged", data);
    }

    subscribeToStationDiscovery() {
        this.discoverStation.on(
            Observable.propertyChangeEvent,
            data => {
                switch (data.propertyName.toString()) {
                    case "stationFound": {
                        console.log("StationMonitor received stationFound for", data.value.name);
                        this.checkDatabase(data.value);
                        break;
                    }
                    case "stationLost": {
                        console.log("StationMonitor received stationLost for", data.value.name);
                        this.deactivateStation(data.value);
                        break;
                    }
                    default: {
                        console.log(data.propertyName.toString() + " " + data.value.toString());
                        break;
                    }
                }
            },
            error => {
                // console.log("propertyChangeEvent error", error);
            }
        );
    }

    checkDatabase(data) {
        const address = data.url;
        this.queryStation.queryStatus(address).then(statusResult => {
            const deviceId = statusResult.status.identity.deviceId;
            return this.dbInterface.getStationByDeviceId(deviceId).then(result => {
                if (result.length == 0) {
                    return this.addToDatabase({
                        device_id: deviceId,
                        address: address,
                        type: data.type,
                        result: statusResult
                    });
                } else {
                    this.reactivateStation(data);
                }
            });
        }).catch(err => {
            console.log(err);
        });
    }

    addToDatabase(data) {
        const deviceStatus = data.result.status;
        const modules = data.result.modules;
        const station = {
            deviceId: data.device_id,
            device_id: data.device_id,
            name: deviceStatus.identity.device,
            url: data.address,
            type: data.type,
            // note: status below will be replaced by actual data from device
            status: "Ready to deploy",
            connected: true,
            battery_level: deviceStatus.power.battery.percentage,
            available_memory: 100 - deviceStatus.memory.dataMemoryConsumption.toFixed(2)
        };
        this.dbInterface.insertStation(station).then(id => {
            station.id = id;
            this.activateStation(station);
            modules.filter(m => {
                return !is_internal_module(m);
            }).map(m => {
                m.stationId = id;
                this.dbInterface.insertModule(m).then(mid => {
                    m.sensors.map(s => {
                        s.moduleId = mid;
                        this.dbInterface.insertSensor(s);
                    });
                });
            });
        });
    }

    sortStations() {
        let stations = Object.values(this.stations);
        stations.sort((a, b) => {
            return b.lastSeen > a.lastSeen ? 1 : b.lastSeen < a.lastSeen ? -1 : 0;
        });
        stations.forEach((s, i) => {
            s.sortedIndex = i + "-" + s.device_id;
        });
        return stations;
    }

    activateStation(station) {
        console.log("activating station --------->", station.name);
        const key = this.makeKey(station);
        station.lastSeen = new Date();
        this.stations[key] = station;
        const stations = this.sortStations();
        this.notifyPropertyChange("stationsChanged", stations);
    }

    reactivateStation(station) {
        console.log("re-activating station --------->", station.name);
        const key = this.makeKey(station);
        if (this.stations[key]) {
            this.stations[key].connected = true;
            this.stations[key].lastSeen = new Date();
        } else {
            // console.log("** reactivation where we don't have the station stored? **");
        }
        this.dbInterface.setStationConnectionStatus(this.stations[key]);
        const stations = this.sortStations();
        this.notifyPropertyChange("stationsChanged", stations);
    }

    deactivateStation(station) {
        if (!station) {
            return;
        }
        console.log("deactivating station --------->", station.name);
        const key = this.makeKey(station);
        if (this.stations[key]) {
            this.stations[key].connected = false;
            this.stations[key].lastSeen = pastDate;
        } else {
            // console.log("** deactivation where we don't have the station stored? **");
        }
        this.dbInterface.setStationConnectionStatus(this.stations[key]);
        const stations = this.sortStations();
        this.notifyPropertyChange("stationsChanged", stations);
    }

    makeKey(station) {
        return station.name + station.type;
    }
}
