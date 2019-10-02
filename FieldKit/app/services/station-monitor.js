import { Observable } from "tns-core-modules/data/observable";
import Config from '../config';

const pastDate = new Date(2000, 0, 1);

function is_internal_module(module) {
    return !Config.includeInternalModules && module.flags & 1; // TODO Pull this enum in from the protobuf file.
}

function is_internal_sensor(sensor) {
    return !Config.includeInternalSensors && sensor.flags & 1; // TODO Pull this enum in from the protobuf file.
}

export default class StationMonitor extends Observable {
    constructor(discoverStation, dbInterface, queryStation) {
        super();
        this.dbInterface = dbInterface;
        this.queryStation = queryStation;
        this.stations = {};
        this.activeAddresses = [];
        this.discoverStation = discoverStation;
        this.subscribeToStationDiscovery();
        this.dbInterface.getAll().then(this.initializeStations.bind(this));
        this.StationsUpdatedProperty = "stationsUpdated";
        this.StationRefreshedProperty = "stationRefreshed";
        this.ReadingsChangedProperty = "readingsChanged";
    }

    clearStations() {
        this.stations = {};
        this.activeAddresses = [];
    }

    initializeStations(result) {
        const thisMonitor = this;
        result.map(r => {
            let key = thisMonitor.makeKey(r);
            r.lastSeen = r.connected ? new Date() : pastDate;
            thisMonitor.stations[key] = r;
        });

        let index = 0; // seeded stations cause delay otherwise
        // kickoff station queries, staggered
        Object.values(this.stations).forEach((station) => {
            if (station.url == "no_url") {
                return;
            }
            setTimeout(() => {this.requestInitialReadings(station)}, 3000*index);
            index += 1;
        });
    }

    getStations() {
        return this.sortStations();
    }

    getStationReadings(station) {
        let key = this.makeKey(station);
        return this.stations[key] ? this.stations[key].readings : null;
    }

    requestInitialReadings(station) {
        if(station.connected == 0) {return}
        // take readings first so they can be stored (active or not)
        this.queryStation
            .takeReadings(station.url)
            .then(this.updateStationReadings.bind(this, station))
            .catch(error => {
                console.log("error taking initial readings", error)
                // try again
                // setTimeout(() => {this.requestInitialReadings(station)}, 2000);
                // don't try again, just start regular queries
                setTimeout(() => {this.requestStationData(station)}, 10000);
            });
    }

    requestStationData(station) {
        const elapsed = new Date() - station.lastSeen;

        // if station hasn't been heard from in awhile, disable it
        // (seeded stations exempt for now due to above return statement)
        if (elapsed > Config.stationTimeoutMs && station.lastSeen != pastDate) {
            this.deactivateStation(station);
        }

        if(station.connected == 0) {return}

        // take readings, if active, otherwise query status
        if (this.activeAddresses.indexOf(station.url) > -1) {
            this.queryStation
                .takeReadings(station.url)
                .then(this.updateStationReadings.bind(this, station))
                .catch(error => console.log("error taking readings", error));
        }
        else {
            this.queryStation
                .getStatus(station.url)
                .then(this.updateStatus.bind(this, station))
                .catch(error => console.log("error getting status", error));
        }
    }

    updateStatus(station, result) {
        if (result.errors.length > 0 || station.device_id != result.status.identity.deviceId) {
            return;
        }
        // now that db can be cleared, might need to re-add stations
        const key = this.makeKey(station);
        if(!this.stations[key]) {
            this.checkDatabase(station);
            return
        }

        station.connected = 1;
        station.lastSeen = new Date();
        station.status = result.status.recording.enabled ? "recording" : "idle";
        station.name = result.status.identity.device;

        // set up next query
        setTimeout(() => {this.requestStationData(station)}, 10000);

        return this._updateStationStatus(station, result);
    }

    updateStationReadings(station, result) {
        if (result.errors.length > 0 || station.device_id != result.status.identity.deviceId) {
            return;
        }
        // now that db can be cleared, might need to re-add stations
        const key = this.makeKey(station);
        if(!this.stations[key]) {
            this.checkDatabase(station);
            return
        }

        station.connected = 1;
        station.lastSeen = new Date();
        station.status = result.status.recording.enabled ? "recording" : "idle";
        const readings = {};
        result.liveReadings.forEach(lr => {
            lr.modules.forEach(m => {
                m.readings.forEach(r => {
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
        // store one set of live readings per station
        station.readings = readings;

        this.notifyPropertyChange(this.ReadingsChangedProperty, data);

        // set up next query
        setTimeout(() => {this.requestStationData(station)}, 10000);

        return this._updateStationStatus(station, result);
    }

    subscribeToStationDiscovery() {
        this.discoverStation.on(Observable.propertyChangeEvent, data => {
                switch (data.propertyName.toString()) {
                    case "stationFound": {
                        // console.log("StationMonitor received stationFound for", data.value.name);
                        this.checkDatabase(data.value);
                        break;
                    }
                    case "stationLost": {
                        // console.log("StationMonitor received stationLost for", data.value.name);
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
        this.queryStation
            .getStatus(address)
            .then(statusResult => {
                const deviceId = statusResult.status.identity.deviceId;
                return this.dbInterface.getStationByDeviceId(deviceId).then(result => {
                    if (result.length == 0) {
                        return this.addToDatabase({
                            device_id: deviceId,
                            address: address,
                            result: statusResult
                        });
                    } else {
                        this.reactivateStation(data, result[0], statusResult);
                    }
                });
            })
            .catch(err => {
                console.log(err);
            });
    }

    addToDatabase(data) {
        const deviceStatus = data.result.status;
        const modules = data.result.modules;
        const recordingStatus = data.result.status.recording.enabled ? "recording" : "idle";
        const station = {
            deviceId: data.device_id,
            device_id: data.device_id,
            name: deviceStatus.identity.device,
            url: data.address,
            status: recordingStatus,
            connected: 1,
            battery_level: deviceStatus.power.battery.percentage,
            available_memory: 100 - deviceStatus.memory.dataMemoryConsumption.toFixed(2),
            longitude: deviceStatus.gps.longitude.toFixed(6),
            latitude: deviceStatus.gps.latitude.toFixed(6)
        };
        this.dbInterface.insertStation(station, data.result).then(id => {
            station.id = id;
            this.activateStation(station);
            modules
                .filter(m => {
                    return !is_internal_module(m);
                })
                .map(m => {
                    m.stationId = id;
                    this.dbInterface.insertModule(m).then(mid => {
                        m.sensors
                            .filter(s => {
                                return !is_internal_sensor(s);
                            })
                            .map(s => {
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

        // start getting readings
        this.requestInitialReadings(station);

        this._publishStationsUpdated();
        this._publishStationRefreshed(this.stations[key]);
    }

    reactivateStation(discoverStation, databaseStation, statusResult) {
        console.log("re-activating station --------->", discoverStation.name);
        const key = this.makeKey(databaseStation);
        if (!this.stations[key]) {
            // TODO: is there an old k:v pair we need to delete?
            this.stations[key] = databaseStation;
        }
        this.stations[key].connected = 1;
        this.stations[key].lastSeen = new Date();
        // prefer statusResult name over database name
        this.stations[key].name = statusResult.status.identity.device;
        // prefer discovered url over database url
        this.stations[key].url = discoverStation.url;

        // start getting readings
        this.requestInitialReadings(this.stations[key]);

        this.dbInterface.setStationConnectionStatus(this.stations[key]).then(() => {
            this._updateStationStatus(this.stations[key], status);
        });
    }

    deactivateStation(station) {
        if (!station) {
            return;
        }
        console.log("deactivating station --------->", station.name);
        this.dbInterface
            .getDeviceId(station)
            .then(result => {
                const key = result && result.length > 0 ? result[0].device_id : "";
                if (this.stations[key]) {
                    this.stations[key].connected = 0;
                    this.stations[key].lastSeen = pastDate;
                } else {
                    // console.log("** deactivation where we don't have the station stored? **");
                }
                this.dbInterface.setStationConnectionStatus(this.stations[key]);

                this._publishStationsUpdated();
                this._publishStationRefreshed(this.stations[key]);
            });
    }

    startLiveReadings(address) {
        if (this.activeAddresses.indexOf(address) == -1) {
            this.activeAddresses.push(address);
        }
    }

    stopLiveReadings(address) {
        const index = this.activeAddresses.indexOf(address);
        if (index > -1) {
            this.activeAddresses.splice(index, 1);
        }
    }

    makeKey(station) {
        if(!station.deviceId && !station.device_id) {
            // console.log("no key for this one ", station)
            return "nokey";
        }
        return station.deviceId ? station.deviceId : station.device_id
    }

    _publishStationRefreshed(station) {
        this.notifyPropertyChange(this.StationRefreshedProperty, station);
        return Promise.resolve();
    }

    _publishStationsUpdated() {
        const stations = this.sortStations();
        this.notifyPropertyChange(this.StationsUpdatedProperty, stations);
        return Promise.resolve();
    }

    _updateStationStatus(station, status) {
        if (status != null) {
            station.statusReply = status;

            // save changes internally
            let key = this.makeKey(station);
            this.stations[key] = station;

            return this.dbInterface.updateStationStatus(station, status).then(() => {
                return this._publishStationsUpdated().then(() => {
                    return this._publishStationRefreshed(station);
                });
            });
        }
        else {
            console.log("No status");
        }
        return Promise.resolve();
    }
}
