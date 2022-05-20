import { Station, PortalError } from "../store/types";
import { ActionTypes, PortalErrorAction, PortalReplyAction } from "../store/actions";
import { OurStore } from "../store/our-store";
import { FileSystem } from "@/services";
import SynchronizeNotes from "./synchronize-notes";
import PortalInterface, { Ids, AxiosError } from "./portal-interface";
import { debug, promiseAfter, serializePromiseChain, zoned } from "@/lib";

export { SynchronizeNotes };

const OneMinute = 60 * 1000;

export default class PortalUpdater {
    private synchronizeNotes: SynchronizeNotes;

    constructor(private readonly portal: PortalInterface, private readonly store: OurStore, fs: FileSystem) {
        this.synchronizeNotes = new SynchronizeNotes(portal, store, fs);
    }

    public async start(): Promise<void> {
        await this.store.dispatch(ActionTypes.RESUME_PORTAL_SESSION);

        void promiseAfter(1 * OneMinute).then(async () => {
            await this.addOrUpdateStations();
            void this.start();
        });

        return Promise.resolve();
    }

    public async addOrUpdateStations(): Promise<void> {
        return zoned(
            { force: true },
            async () =>
                await this.portal.isAvailable().then((yes: boolean) => {
                    if (!yes) {
                        debug.log("portal unavailable, offline?");
                        return Promise.resolve();
                    }

                    if (!this.portal.isLoggedIn()) {
                        debug.log("portal unavailable, no token");
                        return Promise.resolve();
                    }

                    const allStations = this.store.state.stations.all;
                    return serializePromiseChain(allStations, (station: Station) => this.update(station)).then(() => Promise.resolve());
                })
        );
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

        // This is just way to verbose, especially with logs enabled.
        // debug.log(`adding-station: ${JSON.stringify({ params, userId: station.userId })}`);
        try {
            const defaultUser = this.store.state.portal.currentUser;
            const usersById = this.store.getters.usersById;
            const user = (station.userId ? usersById[station.userId] : null) ?? defaultUser;
            if (!user) {
                debug.log(`no-user: ${JSON.stringify({ defaultUser, usersById })}`);
                throw new Error(`no user `);
            }
            debug.log(`adding-station: ${JSON.stringify({ userId: user.portalId })}`);
            const saved = await this.portal.addStation(user, params);
            await this.store.dispatch(new PortalReplyAction(user.portalId, id, saved.id, saved.owner.id));
            const ids = new Ids(id, saved.id);
            await this.synchronizeNotes.synchronize(ids);
        } catch (error) {
            // eslint-disable-next-line
            debug.log(`update-error:`, error, error?.stack);
            await this.recordError(id, error);
        }
    }

    private async recordError(stationId: number, error: AxiosError): Promise<void> {
        if (error?.response?.data) {
            await this.store.dispatch(new PortalErrorAction(stationId, error.response.data as PortalError));
        } else {
            await this.store.dispatch(new PortalErrorAction(stationId, { unknown: true, message: error.message }));
        }
    }
}
