import { Observable } from "tns-core-modules/data/observable";
import Config from '../config';

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
        this.activeAddresses = [];
        this.discoverStation = discoverStation;
        this.subscribeToStationDiscovery();
        this.dbInterface.getAll().then(this.initializeStations.bind(this));
        this.StationsUpdatedProperty = "stationsUpdated";
        this.StationRefreshedProperty = "stationRefreshed";
        this.ReadingsChangedProperty = "readingsChanged";
    }

    initializeStations(result) {
        const thisMonitor = this;
        result.map(r => {
            let key = thisMonitor.makeKey(r);
            r.lastSeen = r.connected ? new Date() : pastDate;
            thisMonitor.stations[key] = r;
            if (r.url != "no_url") {
                // first try, might not have a reading yet
                // JACOB: Can we pull this and the call below into the same
                // function so that the update to the readings happen is they
                // happen to be there?
                // LIBBEY: We don't have to do this at all - it's just here
                // to 'prime the pump,' so the call below is more likely to
                // yield results
                this.queryStation.takeReadings(r.url);
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

            // if station hasn't been heard from in awhile, disable it
            // (seeded stations exempt for now due to above return statement)
            if (elapsed > Config.stationTimeoutMs && station.lastSeen != pastDate) {
                this.deactivateStation(station);
            }

            // take readings, if active, otherwise query regular boring status
            if (this.activeAddresses.indexOf(station.url) > -1) {
                this.queryStation
                    .takeReadings(station.url)
                    .then(this.updateStationReadings.bind(this, station))
                    .catch(error => console.log(error));
            }
            else {
                this.queryStation
                    .getStatus(station.url)
                    .then(this.updateStatus.bind(this, station))
                    .catch(error => console.log(error));
            }
        });
    }

    updateStatus(station, result) {
        if (result.errors.length > 0 || station.name != result.status.identity.device) {
            return Promise.reject();
        }
        station.lastSeen = new Date();
        station.status = result.status.recording.enabled ? "recording" : "idle";
        return this._updateStationStatus(station, result);
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

        this.notifyPropertyChange(this.ReadingsChangedProperty, data);

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
                        this.reactivateStation(data, statusResult);
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
            available_memory: 100 - deviceStatus.memory.dataMemoryConsumption.toFixed(2)
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

        this._publishStationsUpdated();
        this._publishStationRefreshed(this.stations[key]);
    }

    reactivateStation(station, status) {
        console.log("re-activating station --------->", station.name);
        const key = this.makeKey(station);
        if (this.stations[key]) {
            this.stations[key].connected = 1;
            this.stations[key].lastSeen = new Date();
        } else {
            // console.log("** reactivation where we don't have the station stored? **");
        }

        return this.dbInterface.setStationConnectionStatus(this.stations[key]).then(() => {
            return this._updateStationStatus(this.stations[key], status);
        });
    }

    deactivateStation(station) {
        if (!station) {
            return;
        }
        console.log("deactivating station --------->", station.name);
        const key = this.makeKey(station);
        if (this.stations[key]) {
            this.stations[key].connected = 0;
            this.stations[key].lastSeen = pastDate;
        } else {
            // console.log("** deactivation where we don't have the station stored? **");
        }
        this.dbInterface.setStationConnectionStatus(this.stations[key]);

        this._publishStationsUpdated();
        this._publishStationRefreshed(this.stations[key]);
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
        return station.name + station.url;
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
