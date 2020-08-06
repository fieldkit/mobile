import * as ActionTypes from "../store/actions";
import { Station, Store } from "../store/types";
import PortalInterface from "./portal-interface";
import FileSystem from "../wrappers/file-system";
import SynchronizeNotes, { Ids } from "./synchronize-notes";
import { serializePromiseChain } from "../utilities";

const OneMinute = 60 * 1000;

export default class PortalUpdater {
    private synchronizeNotes: SynchronizeNotes;

    constructor(private readonly portal: PortalInterface, private readonly store: Store, fs: FileSystem) {
        this.synchronizeNotes = new SynchronizeNotes(portal, store, fs);
    }

    public start() {
        console.log("PortalUpdater", "started");
        setInterval(() => this.addOrUpdateStations(), 5 * OneMinute);
        return Promise.resolve();
    }

    public addOrUpdateStations() {
        return this.portal.isAvailable().then((yes) => {
            if (!yes || !this.portal.isLoggedIn()) {
                console.log("portal unavailable");
                return Promise.resolve();
            }

            console.log("updating stations", this.store.state.stations.all.length);

            const allStations = this.store.state.stations.all;

            return serializePromiseChain(allStations, (station: Station) => this.update(station));
        });
    }

    private update(station: Station) {
        if (!station.id) {
            throw new Error("station id is required");
        }
        const notes = this.store.state.notes.stations[station.id];
        const params = {
            name: station.name,
            deviceId: station.deviceId,
            statusPb: station.serializedStatus,
            locationName: notes.location,
        };

        return this.portal.addStation(params).then(
            (saved) => {
                if (!station.id) {
                    throw new Error("no station id (should never)");
                }
                const ids = new Ids(station.id, saved.id);
                return this.store.dispatch(ActionTypes.STATION_PORTAL_REPLY, { id: station.id, portalId: saved.id }).then(() => {
                    console.log("updating station", ids, params);
                    return this.portal
                        .updateStation(params, ids.portal)
                        .then((saved) =>
                            this.store.dispatch(ActionTypes.STATION_PORTAL_REPLY, {
                                id: station.id,
                                portalId: saved.id,
                            })
                        )
                        .catch((error) => {
                            if (error.response) {
                                return this.store.dispatch(ActionTypes.STATION_PORTAL_ERROR, {
                                    id: station.id,
                                    error: error.response.data || {},
                                });
                            }
                            return this.store.dispatch(ActionTypes.STATION_PORTAL_ERROR, {
                                id: station.id,
                                error: "error",
                            });
                        })
                        .then(() => {
                            return this.synchronizeNotes.synchronize(ids);
                        });
                });
            },
            (error) => {
                if (error.response) {
                    return this.store.dispatch(ActionTypes.STATION_PORTAL_ERROR, {
                        id: station.id,
                        error: error.response.data || {},
                    });
                }
                return Promise.reject(error);
            }
        );
    }
}
