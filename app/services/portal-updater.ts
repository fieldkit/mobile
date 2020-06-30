import * as ActionTypes from "../store/actions";
import { Store } from "../store/types";

export default class PortalUpdater {
    portalInterface: any;
    store: Store;

    constructor(database, portalInterface, store) {
        this.portalInterface = portalInterface;
        this.store = store;
    }

    start() {
        console.log("PortalUpdater", "started");
        setInterval(() => this.addOrUpdateStations(), 60000);
        return Promise.resolve();
    }

    addOrUpdateStations() {
        console.log("PortalUpdater", "try");
        return this.portalInterface.isAvailable().then(yes => {
            if (!yes && this.portalInterface.isLoggedIn()) {
                console.log("PortalUpdater", "unavailable");
                return Promise.resolve();
            }
            console.log("PortalUpdater", "updating stations", this.store.state.stations.all.length);
            return Promise.all(
                this.store.state.stations.all.map(station => {
                    const params = {
                        name: station.name,
                        deviceId: station.deviceId,
                        device_id: station.deviceId,
                        statusPb: station.serializedStatus,
                        status_pb: station.serializedStatus,
                        status_json: {},
                    };
                    // update or add station
                    if (station.portalId) {
                        return this.portalInterface
                            .updateStation(params, station.portalId)
                            .then(saved => this.store.dispatch(ActionTypes.STATION_PORTAL_REPLY, { id: station.id, portalId: saved.id }))
                            .catch(error => {
                                if (error.response) {
                                    return this.store.dispatch(ActionTypes.STATION_PORTAL_ERROR, {
                                        id: station.id,
                                        error: error.response.status,
                                    });
                                }
                                return this.store.dispatch(ActionTypes.STATION_PORTAL_ERROR, {
                                    id: station.id,
                                    error: "error",
                                });
                            });
                    } else {
                        return this.portalInterface
                            .addStation(params)
                            .then(saved => this.store.dispatch(ActionTypes.STATION_PORTAL_REPLY, { id: station.id, portalId: saved.id }));
                    }
                })
            );
        });
    }
}
