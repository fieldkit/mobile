import { Station, PortalError } from "../store/types";
import { PortalErrorAction, PortalReplyAction } from "../store/actions";
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

    public async addOrUpdateStations(): Promise<void> {
        return await this.portal.isAvailable().then((yes: boolean) => {
            if (!yes) {
                console.log("portal unavailable, offline?");
                return Promise.resolve();
            }

            if (!this.portal.isLoggedIn()) {
                console.log("portal unavailable, no token");
                return Promise.resolve();
            }

            console.log(`updating stations`, this.store.state.stations.all.length);
            const allStations = this.store.state.stations.all;
            return serializePromiseChain(allStations, (station: Station) => this.update(station)).then(() => Promise.resolve());
        });
    }

    private async recordError(stationId: number, error: AxiosError): Promise<void> {
        if (error?.response?.data) {
            await this.store.dispatch(new PortalErrorAction(stationId, error.response.data as PortalError));
        } else {
            await this.store.dispatch(new PortalErrorAction(stationId, { unknown: true, message: error.message }));
        }
    }

    private async update(station: Station): Promise<void> {
        const id = station.id;
        if (!id) throw new Error(`station id is required`);

        const notes = this.store.state.notes.stations[id];
        const params = {
            name: station.name,
            deviceId: station.deviceId,
            statusPb: station.serializedStatus,
            locationName: notes.location,
        };

        console.log(`adding-station: ${JSON.stringify({ params, userId: station.userId })}`);
        try {
            const defaultUser = this.store.state.portal.currentUser;
            const usersById = this.store.getters.usersById;
            const user = (station.userId ? usersById[station.userId] : null) ?? defaultUser;
            if (!user) {
                console.log(`no-user: ${JSON.stringify({ defaultUser, usersById })}`);
                throw new Error(`no user `);
            }
            console.log(`adding-station: ${JSON.stringify({ userId: user.portalId })}`);
            const saved = await this.portal.addStation(user, params);
            await this.store.dispatch(new PortalReplyAction(user, id, saved.id, saved.owner.id));
            const ids = new Ids(id, saved.id);
            await this.synchronizeNotes.synchronize(ids);
        } catch (error) {
            console.log(`error: ${JSON.stringify(error)}`);
            await this.recordError(id, error);
        }
    }
}
