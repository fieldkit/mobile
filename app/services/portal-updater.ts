import { Store } from "../store/types";

export default class PortalUpdater {
    portalInterface: any;
    store: Store;
    database: any;

    constructor(database, portalInterface, store) {
        this.database = database;
        this.portalInterface = portalInterface;
        this.store = store;
    }

    start() {
        setInterval(() => this.addOrUpdateStations(), 60000);
        return Promise.resolve();
    }

    addOrUpdateStations() {
        return this.portalInterface.isAvailable().then(yes => {
            if (!yes && this.portalInterface.isLoggedIn()) {
                return Promise.resolve();
            }
            return this.database.getAll().then(stations => {
                return Promise.all(
                    stations.map(station => {
                        const params = {
                            name: station.name,
                            device_id: station.deviceId,
                            status_json: station,
                            status_pb: station.serializedStatus,
                        };
                        // update or add station
                        if (station.portalId) {
                            return this.portalInterface
                                .updateStation(params, station.portalId)
                                .then(() => {
                                    return this.database.setStationPortalError(station, "");
                                })
                                .catch(error => {
                                    if (error.response) {
                                        return this.database.setStationPortalError(station, error.response.status);
                                    }
                                    console.log("unexpected portal response", error);
                                    return Promise.reject(new Error("unexpected portal response"));
                                });
                        } else {
                            return this.portalInterface.addStation(params).then(result => {
                                station.portalId = result.id;
                                return this.database.setStationPortalId(station);
                            });
                        }
                    })
                );
            });
        });
    }
}
