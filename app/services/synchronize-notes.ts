import _ from "lodash";
// import * as ActionTypes from "../store/actions";
import { Store } from "../store/types";
import PortalInterface from "./portal-interface";
import { Notes } from "../store/modules/notes";

export default class SynchronizeNotes {
    private portal: PortalInterface;
    private store: Store;

    constructor(portal, store) {
        this.portal = portal;
        this.store = store;
    }

    public synchronize() {
        return this.getPortalStations().then((stations: Ids[]) => {
            return Promise.all([
                stations.map((ids) => {
                    return this.portal.getStationNotes(ids.portal).then((portalNotes: PortalStationNotesReply) => {
                        const mobileNotes = this.store.state.notes.stations[ids.mobile];
                        const payload = this.merge(portalNotes, mobileNotes);

                        console.log("payload", ids, payload);

                        return this.portal.updateStationNotes(ids.portal, payload);
                    });
                }),
            ]);
        });
        return Promise.resolve();
    }

    private merge(portalNotes: PortalStationNotesReply, mobileNotes: Notes) {
        const portalExisting = _.keyBy(portalNotes.notes, (n) => n.key);
        const localByKey = {
            studyObjective: mobileNotes.form.studyObjective,
            sitePurpose: mobileNotes.form.sitePurpose,
            siteCriteria: mobileNotes.form.siteCriteria,
            siteDescription: mobileNotes.form.siteDescription,
        };

        const modifications = _(localByKey)
            .mapValues((value, key) => {
                if (portalExisting[key]) {
                    return {
                        creating: null,
                        updating: new ExistingFieldNote(portalExisting[key].id, key, value.body, null),
                    };
                }
                return {
                    creating: new NewFieldNote(key, value.body, null),
                    updating: null,
                };
            })
            .values()
            .value();

        const creating = modifications.map((v) => v.creating).filter((v) => v !== null && v.body.length > 0) as NewFieldNote[];
        const updating = modifications.map((v) => v.updating).filter((v) => v !== null) as ExistingFieldNote[];

        return new PatchPortalNote(creating, updating);
    }

    private getPortalStations() {
        return Promise.resolve(
            this.store.state.stations.all
                .map((station) => {
                    if (station.id && station.portalId) {
                        return new Ids(station.id, station.portalId);
                    }
                    return null;
                })
                .filter((ids) => ids)
        );
    }

    //private stop() {}
}

export class ExistingFieldNote {
    constructor(
        public readonly id: number,
        public readonly key: string,
        public readonly body: string,
        public readonly mediaId: number | null
    ) {}
}

export class NewFieldNote {
    constructor(public readonly key: string, public readonly body: string, public readonly mediaId: number | null) {}
}

export class Ids {
    constructor(public readonly mobile: number, public readonly portal: number) {}
}

export interface PortalStationNotes {
    id: number;
    createdAt: number;
    author: { id: number; name: number };
    key: string;
    body: string;
    mediaId: number;
}

export interface PortalStationNotesReply {
    notes: PortalStationNotes[];
}

export class PatchPortalNote {
    constructor(public readonly creating: NewFieldNote[], public readonly notes: ExistingFieldNote[]) {}
}

export interface PortalPatchNotesPayload {
    notes: PatchPortalNote[];
}
