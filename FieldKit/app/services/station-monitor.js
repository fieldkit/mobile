import { Observable } from "tns-core-modules/data/observable";
import { promiseAfter, convertBytesToLabel } from "../utilities";
import Config from "../config";

const pastDate = new Date(2000, 0, 1);
const oneHour = 3600000;

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
        // stations whose details are being viewed in app are "active"
        this.activeAddresses = [];
        this.queriesInProgress = {};
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
            r.lastSeen = pastDate;
            // not getting connected from db anymore
            // all are disconnected until discovered
            r.connected = false;
            thisMonitor.stations[r.deviceId] = r;
        });
    }

    getStations() {
        return this.sortStations();
    }

    getStationReadings(station) {
        return this.stations[station.deviceId]
            ? this.stations[station.deviceId].readings
            : null;
    }

    requestInitialReadings(station) {
        if (!station.connected) {
            return Promise.reject();
        }

        // take readings first so they can be stored (active or not)
        return this.requestStationData(station, true);
    }

    // take readings, if active, otherwise query status
    _statusOrReadings(station, takeReadings) {
        if (takeReadings || this.activeAddresses.indexOf(station.url) > -1) {
            return this.queryStation
                .takeReadings(station.url)
                .then(this.updateStationReadings.bind(this, station));
        }
        return this.queryStation
            .getStatus(station.url)
            .then(this.updateStatus.bind(this, station));
    }

    requestStationData(station, takeReadings) {
        // if station hasn't been heard from in awhile, disable it
        const elapsed = new Date() - station.lastSeen;
        if (elapsed > Config.stationTimeoutMs && station.lastSeen != pastDate) {
            console.log("station inactive");
            delete this.queriesInProgress[station.deviceId];
            this.deactivateStation(station.deviceId);
        }

        if (!station.connected) {
            delete this.queriesInProgress[station.deviceId];
            return Promise.reject();
        }

        this.queriesInProgress[station.deviceId] = true;

        return this._statusOrReadings(station, takeReadings)
            .finally(() => {
                return promiseAfter(10000).then(() =>
                    this.requestStationData(station, false)
                );
            })
            .catch(error => {
                console.log("requestStationData error", error);
            });
    }

    updateStatus(station, result) {
        if (
            result.errors.length > 0 ||
            station.deviceId != result.status.identity.deviceId
        ) {
            return;
        }
        // now that db can be cleared, might need to re-add stations
        if (!this.stations[station.deviceId]) {
            return this.checkDatabase(station.deviceId, station.url);
        }

        station.connected = true;
        station.lastSeen = new Date();
        const newStatus = result.status.recording.enabled ? "recording" : "";
        // db needs to be kept in sync
        if (newStatus != station.status) {
            this.dbInterface.setStationDeployStatus(station);
        }
        station.status = newStatus;
        station.name = result.status.identity.device;
        return this._updateStationStatus(station, result);
    }

    updateStationReadings(station, result) {
        if (
            result.errors.length > 0 ||
            station.deviceId != result.status.identity.deviceId
        ) {
            return Promise.reject();
        }
        // now that db can be cleared, might need to re-add stations
        if (!this.stations[station.deviceId]) {
            return this.checkDatabase(station.deviceId, station.url);
        }

        station.connected = true;
        station.lastSeen = new Date();
        const newStatus = result.status.recording.enabled ? "recording" : "";
        // db needs to be kept in sync
        if (newStatus != station.status) {
            this.dbInterface.setStationDeployStatus(station);
        }
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
            consumedMemory: result.status.memory.dataMemoryUsed
                ? convertBytesToLabel(result.status.memory.dataMemoryUsed)
                : "Unknown",
            totalMemory: convertBytesToLabel(
                result.status.memory.dataMemoryInstalled
            ),
            consumedMemoryPercent: result.status.memory.dataMemoryConsumption
        };
        // store one set of live readings per station
        station.readings = readings;

        this.notifyPropertyChange(this.ReadingsChangedProperty, data);

        return this._updateStationStatus(station, result);
    }

    recordingStatusChange(address, recording) {
        const stations = Object.values(this.stations);
        let station = stations.find(s => {
            return s.url == address;
        });
        if (station) {
            const newStatus = recording == "started" ? "recording" : "";
            station.status = newStatus;
            this.stations[station.deviceId] = station;
            this._publishStationsUpdated();
        }
    }

    subscribeToStationDiscovery() {
        this.discoverStation.on(
            Observable.propertyChangeEvent,
            data => {
                switch (data.propertyName.toString()) {
                    case "stationFound": {
                        this.checkDatabase(data.value.name, data.value.url);
                        break;
                    }
                    case "stationLost": {
                        if (data.value) {
                            console.log("station lost");
                            this.deactivateStation(data.value.name);
                        }
                        break;
                    }
                    default: {
                        console.log(
                            data.propertyName.toString() +
                                " " +
                                data.value.toString()
                        );
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
        return this.queryStation
            .getStatus(address)
            .then(statusResult => {
                return this.dbInterface
                    .getStationByDeviceId(deviceId)
                    .then(result => {
                        if (result.length == 0) {
                            return this.addToDatabase({
                                deviceId: deviceId,
                                address: address,
                                result: statusResult
                            });
                        } else {
                            this.reactivateStation(
                                address,
                                result[0],
                                statusResult
                            );
                        }
                    });
            })
            .catch(err => {
                // console.log("error getting status in checkDatabase", err);
                console.log(
                    "the station at",
                    address,
                    "did not respond with a status. instead:",
                    err
                );
            });
    }

    addToDatabase(data) {
        const deviceStatus = data.result.status;
        const modules = data.result.modules;
        const recordingStatus = data.result.status.recording.enabled
            ? "recording"
            : "";
        let deployStartTime = data.result.status.recording.startedTime
            ? new Date(data.result.status.recording.startedTime * 1000)
            : "";

        const station = {
            deviceId: data.deviceId,
            name: deviceStatus.identity.device,
            url: data.address,
            status: recordingStatus,
            deployStartTime: deployStartTime,
            connected: true,
            interval: data.result.schedules.readings.interval,
            batteryLevel: deviceStatus.power.battery.percentage,
            longitude: deviceStatus.gps.longitude.toFixed(6),
            latitude: deviceStatus.gps.latitude.toFixed(6),
            consumedMemory: deviceStatus.memory.dataMemoryUsed,
            totalMemory: deviceStatus.memory.dataMemoryInstalled,
            consumedMemoryPercent: deviceStatus.memory.dataMemoryConsumption
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
        // sort by recency first, rounded to hour
        stations.sort((a, b) => {
            const aTime = (a.lastSeen / oneHour) * oneHour;
            const bTime = (b.lastSeen / oneHour) * oneHour;
            return bTime > aTime ? 1 : bTime < aTime ? -1 : 0;
        });
        // then sort by alpha
        stations.sort((a, b) => {
            return b.name > a.name ? 1 : b.name < a.name ? -1 : 0;
        });
        stations.forEach((s, i) => {
            s.sortedIndex = i + "-" + s.deviceId;
        });
        return stations;
    }

    activateStation(station) {
        console.log("activating station --------->", station.name);
        station.lastSeen = new Date();
        station.connected = true;
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
        this.stations[deviceId].connected = true;
        this.stations[deviceId].lastSeen = new Date();
        // prefer statusResult name over database name
        this.stations[deviceId].name = statusResult.status.identity.device;
        // prefer discovered url over database url
        this.stations[deviceId].url = address;
        // and update the database url!
        this.dbInterface.setStationUrl(this.stations[deviceId]);

        // start getting readings
        if (!this.queriesInProgress[deviceId]) {
            this.requestInitialReadings(this.stations[deviceId]);
        }
    }

    deactivateStation(deviceId) {
        if (!deviceId) {
            return;
        }
        if (this.stations[deviceId]) {
            console.log(
                "deactivating station --------->",
                this.stations[deviceId].name
            );
            this.stations[deviceId].connected = false;
            this.stations[deviceId].lastSeen = pastDate;
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

            return this.dbInterface
                .updateStationStatus(station, status)
                .then(() => {
                    return this._publishStationsUpdated().then(() => {
                        return this._publishStationRefreshed(station);
                    });
                });
        } else {
            console.log("No status");
        }
        return Promise.resolve();
    }
}
