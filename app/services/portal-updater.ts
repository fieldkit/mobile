import { Station, PortalError } from "../store/types";
import { ActionTypes } from "../store/actions";
import { Store } from "../store/our-store";
import { FileSystem } from "@/services";
import SynchronizeNotes from "./synchronize-notes";
import PortalInterface, { Ids, AxiosError } from "./portal-interface";
import { serializePromiseChain } from "../utilities";

export { SynchronizeNotes };

const OneMinute = 60 * 1000;

export default class PortalUpdater {
    private synchronizeNotes: SynchronizeNotes;

    constructor(private readonly portal: PortalInterface, private readonly store: Store, fs: FileSystem) {
        this.synchronizeNotes = new SynchronizeNotes(portal, store, fs);
    }

    public start(): Promise<void> {
        console.log("PortalUpdater", "started");
        setInterval(() => void this.addOrUpdateStations(), 1 * OneMinute);
        return Promise.resolve();
    }

    public addOrUpdateStations(): Promise<void> {
        return this.portal.isAvailable().then((yes: boolean) => {
            if (!yes) {
                console.log("portal unavailable, offline?");
                return Promise.resolve();
            }

            if (!this.portal.isLoggedIn()) {
                console.log("portal unavailable, no token");
                return Promise.resolve();
            }

            console.log("updating stations", this.store.state.stations.all.length);
            const allStations = this.store.state.stations.all;
            return serializePromiseChain(allStations, (station: Station) => this.update(station)).then(() => Promise.resolve());
        });
    }

    private recordError(stationId: number, error: AxiosError) {
        if (error?.response?.data) {
            return this.store.dispatch(ActionTypes.STATION_PORTAL_ERROR, {
                id: stationId,
                error: error.response.data as PortalError,
            });
        }
        return this.store.dispatch(ActionTypes.STATION_PORTAL_ERROR, {
            id: stationId,
            error: { unknown: true, message: error.message },
        });
    }

    private update(station: Station): Promise<void> {
        const id = station.id;
        if (!id) throw new Error("station id is required");
        const notes = this.store.state.notes.stations[id];
        const params = {
            name: station.name,
            deviceId: station.deviceId,
            statusPb: station.serializedStatus,
            locationName: notes.location,
        };

        console.log("adding station", id);

        return this.portal
            .addStation(params)
            .then(
                (saved) => {
                    if (!id) throw new Error("no station id (should never)");
                    const ids = new Ids(id, saved.id);
                    return this.store.dispatch(ActionTypes.STATION_PORTAL_REPLY, { id: id, portalId: saved.id }).then(() => {
                        console.log("updating station", ids, params);
                        return this.portal
                            .updateStation(params, ids.portal)
                            .then((saved) =>
                                this.store.dispatch(ActionTypes.STATION_PORTAL_REPLY, {
                                    id: id,
                                    portalId: saved.id,
                                })
                            )
                            .catch((error) => this.recordError(id, error))
                            .then(() => this.synchronizeNotes.synchronize(ids));
                    });
                },
                (error) => this.recordError(id, error)
            )
            .then(() => Promise.resolve());
    }
}
