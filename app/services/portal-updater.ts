import * as ActionTypes from "../store/actions";
import { Station, Store } from "../store/types";
import PortalInterface from "./portal-interface";
import SynchronizeNotes from "./synchronize-notes";

export default class PortalUpdater {
    private portalInterface: PortalInterface;
    private store: Store;
    private synchronizeNotes: SynchronizeNotes;

    constructor(portalInterface, store) {
        this.portalInterface = portalInterface;
        this.store = store;
        this.synchronizeNotes = new SynchronizeNotes(portalInterface, store);
    }

    public start() {
        console.log("PortalUpdater", "started");
        const OneMinute = 60 * 1000;
        setInterval(() => this.addOrUpdateStations(), OneMinute * 5);
        return Promise.resolve();
    }

    private addOrUpdateStations() {
        console.log("PortalUpdater", "try");
        return this.portalInterface
            .isAvailable()
            .then((yes) => {
                if (!yes && this.portalInterface.isLoggedIn()) {
                    console.log("PortalUpdater", "unavailable");
                    return Promise.resolve();
                }
                console.log("PortalUpdater", "updating stations", this.store.state.stations.all.length);
                return Promise.all(
                    this.store.state.stations.all.map((station: Station) => {
                        if (!station.id) {
                            throw new Error("station id is required");
                        }
                        const notes = this.store.state.notes.stations[station.id];
                        const params = {
                            name: station.name,
                            deviceId: station.deviceId,
                            device_id: station.deviceId,
                            statusPb: station.serializedStatus,
                            status_pb: station.serializedStatus,
                            status_json: {},
                            locationName: notes.location,
                            location_name: notes.location,
                        };
                        if (station.portalId) {
                            return this.portalInterface
                                .updateStation(params, station.portalId)
                                .then((saved) =>
                                    this.store.dispatch(ActionTypes.STATION_PORTAL_REPLY, { id: station.id, portalId: saved.id })
                                )
                                .catch((error) => {
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
                                .then((saved) =>
                                    this.store.dispatch(ActionTypes.STATION_PORTAL_REPLY, { id: station.id, portalId: saved.id })
                                );
                        }
                    })
                );
            })
            .then(() => {
                return this.synchronizeNotes.synchronize();
            });
    }
}
