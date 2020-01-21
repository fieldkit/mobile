import { Observable } from "tns-core-modules/data/observable";
import { promiseAfter, convertBytesToLabel } from "../utilities";
import Config from "../config";
import _ from "lodash";

import StationLogs from "./station-logs";

const pastDate = new Date(2000, 0, 1);
const oneHour = 3600000;
const oneMinute = 60000;

function is_internal_module(module) {
    return !Config.includeInternalModules && module.flags & 1; // TODO Pull this enum in from the protobuf file.
}

function is_internal_sensor(sensor) {
    return !Config.includeInternalSensors && sensor.flags & 1; // TODO Pull this enum in from the protobuf file.
}

export default class StationMonitor extends Observable {
    constructor(discoverStation, dbInterface, queryStation, phoneLocation) {
        super();
        this.dbInterface = dbInterface;
        this.queryStation = queryStation;
        this.phoneLocation = phoneLocation;
        this.stations = {};
        // stations whose details are being viewed in app are "active"
        this.activeAddresses = [];
        this.queriesInProgress = {};
        this.discoverStation = discoverStation;
        this.dbInterface.getAll().then(this.initializeStations.bind(this));
        this.StationsUpdatedProperty = "stationsUpdated";
        this.StationRefreshedProperty = "stationRefreshed";
        this.ReadingsChangedProperty = "readingsChanged";
		this.logs = new StationLogs(discoverStation, queryStation);

        // temporary method to clear out modules with no device ids
        this.dbInterface.removeNullIdModules();

        // TODO: hook in to lifecycle event instead?
        setTimeout(() => {
            this.phoneLocation
                .enableAndGetLocation()
                .then(this.savePhoneLocation.bind(this));
            this.subscribeToStationDiscovery();
        }, 3000);
    }

    clearStations() {
        this.stations = {};
        this.activeAddresses = [];
    }

    savePhoneLocation(loc) {
        this.phoneLat = loc.latitude;
        this.phoneLong = loc.longitude;
        console.log("|--> Phone coordinates reported as", this.phoneLat, this.phoneLong)
    }

    initializeStations(result) {
        const thisMonitor = this;
        result.map(r => {
            r.lastSeen = new Date(r.updated);
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
        delete this.queriesInProgress[station.deviceId];
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
        this.keepDatabaseFieldsInSync(station, result);
        return this._updateStationStatus(station, result);
    }

    updateStationReadings(station, result) {
        delete this.queriesInProgress[station.deviceId];
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
        this.keepDatabaseFieldsInSync(station, result);

        const readings = {};
        result.liveReadings.forEach(lr => {
            lr.modules.forEach(m => {
                m.readings.forEach(r => {
                    readings[m.module.name + r.sensor.name] = r.value || 0;
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

    keepDatabaseFieldsInSync(station, result) {
        const newStatus = result.status.recording.enabled ? "recording" : "";
        // db needs to be kept in sync
        if (newStatus != station.status) {
            station.status = newStatus;
            this.dbInterface.setStationDeployStatus(station);
        }
        if (result.status.identity.generationId != station.generationId) {
            station.generationId = result.status.identity.generationId;
            this.dbInterface.setGenerationId(station);
            if (newStatus != "recording") {
                // new generation and not recording, so
                // possible factory reset. reset deploy notes
                this.dbInterface.clearDeployNotes(station);
            }
        }
        const deployStartTime = result.status.recording.startedTime
            ? new Date(result.status.recording.startedTime * 1000)
            : "";
        if (deployStartTime != station.deployStartTime) {
            station.deployStartTime = deployStartTime;
            this.dbInterface.setStationDeployStartTime(station);
        }
        station.name = result.status.identity.device;

        console.log("|--> Before updating station has", station.latitude, station.longitude);
        console.log("|--> First trying the station coords", result.status.gps.latitude, result.status.gps.longitude);
        if (
            (result.status.gps.longitude != 1000 &&
                station.longitude != result.status.gps.longitude) ||
            (result.status.gps.latitude != 1000 &&
                station.latitude != result.status.gps.latitude)
        ) {
            station.longitude = result.status.gps.longitude;
            station.latitude = result.status.gps.latitude;
        console.log("|--> They look good so we are updating station", station.latitude, station.longitude);
            this.dbInterface.setStationLocationCoordinates(station);
        }
        // some existing stations may have 1000, 1000 saved
        // we can probably remove this in the near future
        console.log("|--> Final check in case they are 1000 or 0", station.latitude, station.longitude);
        if (
            station.latitude == 1000 || station.longitude == 1000 ||
            station.latitude === 0 || station.longitude === 0
        ) {
            // use phone location
            station.longitude = this.phoneLong;
            station.latitude = this.phoneLat;
        console.log("|--> They were no good so using the phones location", station.latitude, station.longitude);
            this.dbInterface.setStationLocationCoordinates(station);
        }
        console.log("|--> The app is done updating and station has", station.latitude, station.longitude);

        this.keepModulesAndSensorsInSync(station, result);
    }

    keepModulesAndSensorsInSync(station, result) {
        const hwModules = result.modules.filter(m => {
                return !is_internal_module(m);
            });

        this.dbInterface.getModules(station.id).then(dbModules => {
            // compare hwModules with dbModules
            const notFromHW = _.differenceBy(dbModules, hwModules, (m) => {
                return m.deviceId;
            });
            // remove modules not in the station's response
            Promise.all(
                notFromHW.map(m => {
                    return this.dbInterface
                        .removeModule(m.deviceId)
                })
            ).then(() => {
                // also remove associated sensors
                Promise.all(
                    notFromHW.map(m => {
                        return this.dbInterface
                            .removeSensors(m.deviceId)
                    })
                )
            });
            // update modules in station's response
            hwModules.forEach(hwModule => {
                const dbModule = dbModules.find(d => {
                    return d.deviceId == hwModule.deviceId;
                });
                if (dbModule) {
                    // update name if needed
                    if (dbModule.name != hwModule.name) {
                        this.dbInterface.setModuleName(hwModule);
                    }
                } else {
                    // add those not in the database
                    hwModule.stationId = station.id;
                    this.dbInterface.insertModule(hwModule)
                }
                // and update its sensors
                this.updateSensors(hwModule);
            });
        });
    }

    updateSensors(hwModule) {
        const hwSensors = hwModule.sensors.filter(s => {
                return !is_internal_sensor(s);
            });

        this.dbInterface.getSensors(hwModule.deviceId)
            .then(dbSensors => {
                // compare hwSensors with dbSensors
                // TODO: what if more than one sensor with the same name?
                const notFromHW = _.differenceBy(dbSensors, hwSensors, (s) => {
                    return s.name;
                });
                const notInDB = _.differenceBy(hwSensors, dbSensors, (s) => {
                    return s.name;
                });
                // remove those that are not on this module anymore
                Promise.all(
                    notFromHW.map(s => {
                        return this.dbInterface.removeSensor(s.id)
                    })
                ).then(() => {
                    // and add those that are newly present
                    Promise.all(
                        notInDB.map(s => {
                            s.moduleId = hwModule.deviceId;
                            return this.dbInterface.insertSensor(s)
                        })
                    )
                });
        });
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
                    case this.discoverStation.StationFoundProperty: {
                        this.checkDatabase(data.value.name, data.value.url);
                        break;
                    }
                    case this.discoverStation.StationLostProperty: {
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
        // use phone location if station doesn't report coordinates
        let latitude = this.phoneLat;
        if (deviceStatus.gps.latitude && deviceStatus.gps.latitude != 1000) {
            latitude = deviceStatus.gps.latitude.toFixed(6);
        }
        let longitude = this.phoneLong;
        if (deviceStatus.gps.longitude && deviceStatus.gps.longitude != 1000) {
            longitude = deviceStatus.gps.longitude.toFixed(6);
        }

        const station = {
            deviceId: data.deviceId,
            generationId: deviceStatus.identity.generationId,
            name: deviceStatus.identity.device,
            url: data.address,
            status: recordingStatus,
            deployStartTime: deployStartTime,
            connected: true,
            interval: data.result.schedules.readings.interval,
            batteryLevel: deviceStatus.power.battery.percentage,
            longitude: longitude,
            latitude: latitude,
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
                                s.moduleId = m.deviceId;
                                this.dbInterface.insertSensor(s);
                            });
                    });
                });
        });
    }

    sortStations() {
        let stations = Object.values(this.stations);
        // sort by alpha first
        stations.sort((a, b) => {
            return b.name > a.name ? 1 : b.name < a.name ? -1 : 0;
        });
        // then sort by recency, rounded to minute
        stations.sort((a, b) => {
            const aTime = (a.lastSeen / oneMinute) * oneMinute;
            const bTime = (b.lastSeen / oneMinute) * oneMinute;
            return bTime > aTime ? 1 : bTime < aTime ? -1 : 0;
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
        // prefer statusResult name over database name, unless undefined
        if (statusResult.status.identity.device) {
            this.stations[deviceId].name = statusResult.status.identity.device;
        }
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
