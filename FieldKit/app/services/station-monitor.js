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
            r.lastSeen = r.connected ? new Date() : pastDate;
            thisMonitor.stations[r.deviceId] = r;
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
        return this.stations[station.deviceId] ? this.stations[station.deviceId].readings : null;
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
            this.deactivateStation(station.deviceId);
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
        if (result.errors.length > 0 || station.deviceId != result.status.identity.deviceId) {
            return;
        }
        // now that db can be cleared, might need to re-add stations
        if(!this.stations[station.deviceId]) {
            this.checkDatabase(station.deviceId, station.url);
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
        if (result.errors.length > 0 || station.deviceId != result.status.identity.deviceId) {
            return;
        }
        // now that db can be cleared, might need to re-add stations
        if(!this.stations[station.deviceId]) {
            this.checkDatabase(station.deviceId, station.url);
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
                        this.checkDatabase(data.value.name, data.value.url);
                        break;
                    }
                    case "stationLost": {
                        if(data.value) {
                            this.deactivateStation(data.value.name);
                        }
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

    checkDatabase(deviceId, address) {
        this.queryStation
            .getStatus(address)
            .then(statusResult => {
                return this.dbInterface.getStationByDeviceId(deviceId).then(result => {
                    if (result.length == 0) {
                        return this.addToDatabase({
                            deviceId: deviceId,
                            address: address,
                            result: statusResult
                        });
                    } else {
                        this.reactivateStation(address, result[0], statusResult);
                    }
                });
            })
            .catch(err => {
                console.log("error getting status in checkDatabase", err);
            });
    }

    addToDatabase(data) {
        const deviceStatus = data.result.status;
        const modules = data.result.modules;
        const recordingStatus = data.result.status.recording.enabled ? "recording" : "idle";
        const station = {
            deviceId: data.deviceId,
            name: deviceStatus.identity.device,
            url: data.address,
            status: recordingStatus,
            connected: 1,
            batteryLevel: deviceStatus.power.battery.percentage,
            availableMemory: 100 - deviceStatus.memory.dataMemoryConsumption.toFixed(2),
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
            s.sortedIndex = i + "-" + s.deviceId;
        });
        return stations;
    }

    activateStation(station) {
        console.log("activating station --------->", station.name);
        station.lastSeen = new Date();
        this.stations[station.deviceId] = station;

        // start getting readings
        this.requestInitialReadings(station);

        this._publishStationsUpdated();
        this._publishStationRefreshed(this.stations[station.deviceId]);
    }

    reactivateStation(address, databaseStation, statusResult) {
        console.log("re-activating station --------->", databaseStation.name);
        const deviceId = databaseStation.deviceId;
        if (!this.stations[deviceId]) {
            // TODO: is there an old k:v pair we need to delete?
            this.stations[deviceId] = databaseStation;
        }
        this.stations[deviceId].connected = 1;
        this.stations[deviceId].lastSeen = new Date();
        // prefer statusResult name over database name
        this.stations[deviceId].name = statusResult.status.identity.device;
        // prefer discovered url over database url
        this.stations[deviceId].url = address;

        // start getting readings
        this.requestInitialReadings(this.stations[deviceId]);

        this.dbInterface.setStationConnectionStatus(this.stations[deviceId]).then(() => {
            this._updateStationStatus(this.stations[deviceId], status);
        });
    }

    deactivateStation(deviceId) {
        if (!deviceId) {
            return;
        }
        if (this.stations[deviceId]) {
            console.log("deactivating station --------->", this.stations[deviceId].name);
            this.stations[deviceId].connected = 0;
            this.stations[deviceId].lastSeen = pastDate;
            this.dbInterface.setStationConnectionStatus(this.stations[deviceId]);
            this._publishStationsUpdated();
            this._publishStationRefreshed(this.stations[deviceId]);
        } else {
            // console.log("** deactivation where we don't have the station stored? **");
        }
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
            this.stations[station.deviceId] = station;

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
