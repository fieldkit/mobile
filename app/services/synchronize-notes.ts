import _ from "lodash";
import { Store } from "../store/types";
import PortalInterface from "./portal-interface";
import { Notes } from "../store/modules/notes";
import { serializePromiseChain } from "../utilities";

export default class SynchronizeNotes {
    private portal: PortalInterface;
    private store: Store;

    constructor(portal, store) {
        this.portal = portal;
        this.store = store;
    }

    public synchronize(ids: Ids) {
        return this.portal.getStationNotes(ids.portal).then((portalNotes: PortalStationNotesReply) => {
            const mobileNotes = this.store.state.notes.stations[ids.mobile];

            return this.media(ids, portalNotes, mobileNotes).then((resolvedMedia) => {
                console.log("uploaded", resolvedMedia);

                const payload = this.merge(portalNotes, mobileNotes, resolvedMedia);
                console.log("payload", ids, payload);

                if (payload.creating.length == 0 && payload.notes.length == 0) {
                    return [];
                }

                return this.portal.updateStationNotes(ids.portal, payload);
            });
        });
    }

    private getFileName(path: string): string {
        const name = _.last(path.split("/"));
        if (!name) {
            throw new Error(`error getting file name: ${path}`);
        }
        return name;
    }

    public media(ids: Ids, portalNotes: PortalStationNotesReply, mobileNotes: Notes) {
        const allPortalMedia = [...portalNotes.media, ..._.flatten(portalNotes.notes.map((n) => n.media))];
        const portalByKey = _.keyBy(allPortalMedia, (m) => m.key);

        const allLocalMedia = mobileNotes.allMedia();
        const localByKey = _.keyBy(allLocalMedia, (m) => this.getFileName(m.path));

        console.log("ids", ids);
        console.log("portal", portalByKey);
        console.log("local", localByKey);

        return serializePromiseChain(_.keys(localByKey), (key) => {
            if (portalByKey[key]) {
                return [localByKey[key].path, portalByKey[key].id];
            }
            const path = localByKey[key].path;
            const contentType = "application/octet-stream";
            return this.portal.uploadStationMedia(ids.portal, key, contentType, path).then((response) => {
                if (response.status != 200) {
                    return Promise.reject(new Error("error uploading media"));
                }
                console.log("upload done", response);
                return [path, response.data.id];
            });
        }).then((pathAndId) => {
            console.log("media paths and ids", pathAndId);
            return _.fromPairs(pathAndId);
        });
    }

    private merge(portalNotes: PortalStationNotesReply, mobileNotes: Notes, media: { [index: string]: number }) {
        const portalExisting = _.keyBy(portalNotes.notes, (n) => n.key);
        const localByKey = {
            studyObjective: mobileNotes.form.studyObjective,
            sitePurpose: mobileNotes.form.sitePurpose,
            siteCriteria: mobileNotes.form.siteCriteria,
            siteDescription: mobileNotes.form.siteDescription,
        };

        const modifications = _(localByKey)
            .mapValues((value, key) => {
                const photoIds = value.photos.map((m) => media[m.path]).filter((v) => v);
                const audioIds = value.audio.map((m) => media[m.path]).filter((v) => v);
                const mediaIds = [...photoIds, ...audioIds];

                if (portalExisting[key]) {
                    return {
                        creating: null,
                        updating: new ExistingFieldNote(portalExisting[key].id, key, value.body, mediaIds),
                    };
                }
                return {
                    creating: new NewFieldNote(key, value.body, mediaIds),
                    updating: null,
                };
            })
            .values()
            .value();

        const creating = modifications.map((v) => v.creating).filter((v) => v !== null && v.body.length > 0) as NewFieldNote[];
        const updating = modifications.map((v) => v.updating).filter((v) => v !== null) as ExistingFieldNote[];

        return new PatchPortalNote(creating, updating);
    }
}

export class ExistingFieldNote {
    constructor(
        public readonly id: number,
        public readonly key: string,
        public readonly body: string,
        public readonly mediaIds: number[]
    ) {}
}

export class NewFieldNote {
    constructor(public readonly key: string, public readonly body: string, public readonly mediaIds: number[]) {}
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
    media: { id: number; key: string; url: string; contentType: string }[];
}

export interface PortalNoteMedia {
    id: number;
    contentType: string;
    url: string;
    key: string;
}

export interface PortalStationNotesReply {
    media: PortalNoteMedia[];
    notes: PortalStationNotes[];
}

export class PatchPortalNote {
    constructor(public readonly creating: NewFieldNote[], public readonly notes: ExistingFieldNote[]) {}
}

export interface PortalPatchNotesPayload {
    notes: PatchPortalNote[];
}
