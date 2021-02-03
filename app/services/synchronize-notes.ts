import _ from "lodash";
import moment from "moment";
import FileSystem from "@/wrappers/file-system";
import { ActionTypes } from "../store/actions";
import { UpdateNoteMutation, AttachNoteMediaMutation } from "../store/mutations";
import { Store } from "../store/our-store";
import PortalInterface, { Ids, PatchPortalNotes, PortalStationNotesReply, ExistingFieldNote, NewFieldNote } from "./portal-interface";
import { Notes } from "../store/modules/notes";
import { serializePromiseChain } from "../utilities";
import { getPathTimestamp, rebaseAbsolutePath } from "@/lib/fs";

export class MergedNotes {
    constructor(public readonly patch: PatchPortalNotes, public readonly modified: boolean) {}
}

const EarlyDate: Date = new Date(-8640000000000000);

export default class SynchronizeNotes {
    constructor(private readonly portal: PortalInterface, private readonly store: Store, private readonly fs: FileSystem) {}

    public async synchronize(ids: Ids): Promise<void> {
        await this.portal
            .getStationNotes(ids.portal)
            .then((portalNotes: PortalStationNotesReply) => {
                const mobileNotes = this.store.state.notes.stations[ids.mobile] || new Notes(ids.mobile, EarlyDate, EarlyDate);

                return this.media(ids, portalNotes, mobileNotes).then((resolvedMedia) => {
                    console.log(`notes: resolved-media`, resolvedMedia);

                    const merged = this.merge(ids, portalNotes, mobileNotes, resolvedMedia);
                    const patch = merged.patch;

                    return this.patchPortal(ids, patch).then(() => {
                        if (merged.modified) {
                            return this.store.dispatch(ActionTypes.SAVE_NOTES, { stationId: ids.mobile });
                        }
                        return Promise.resolve();
                    });
                });
            })
            .then(() => Promise.resolve());
    }

    private async patchPortal(ids: Ids, patch: PatchPortalNotes): Promise<void> {
        if (patch.creating.length == 0 && patch.notes.length == 0) {
            console.log(`patching(noop): ${JSON.stringify({ ids, patch })}`);
            return;
        }
        console.log(`patching: ${JSON.stringify({ ids, patch })}`);
        await this.portal.updateStationNotes(ids.portal, patch);
    }

    private parseStampMaybe(key: string): string {
        try {
            const stampLike = key.split(".")[0];
            const stamp = moment(stampLike, "YYYYMMDD_hhmmss");
            if (!stamp.isValid()) {
                throw new Error(`error parsing '${key}' / '${stampLike}' as time`);
            }
            return getPathTimestamp(stamp);
        } catch (e) {
            console.log(`error parsing '${key}' as time`, e);
            throw new Error(`error parsing '${key}' as time`);
        }
    }

    // Used when we're downlaoding to make the file name, this can be deprecated eventually.
    private makeFileNameForPortalDownload(key: string, contentType: string): string {
        const ts = this.parseStampMaybe(key);
        if (/jpeg/.test(contentType) || /jpg/.test(contentType)) return ts + ".jpg";
        if (/png/.test(contentType)) return ts + ".png";
        if (/gif/.test(contentType)) return ts + ".gif";
        if (/caf/.test(contentType)) return ts + ".caf";
        if (/mp4a/.test(contentType)) return ts + ".m4a";
        if (/mp4/.test(contentType)) return ts + ".m4a";
        if (/m4a/.test(contentType)) return ts + ".m4a";
        throw new Error(`unexpected contentType: ${contentType}`);
    }

    // Used when uploading to the server.
    private getContentType(path: string): string {
        if (/\.jpg$/.test(path)) return "image/jpeg";
        if (/\.caf$/.test(path)) return "audio/x-caf";
        if (/\.m4a$/.test(path)) return "video/mp4";
        // NOTE Server will reject this.
        return "application/octet-stream";
    }

    private async media(ids: Ids, portalNotes: PortalStationNotesReply, mobileNotes: Notes): Promise<{ [index: string]: number }> {
        const allPortalMedia = [...(portalNotes.media || []), ..._.flatten(portalNotes.notes.map((n) => n.media || []))];
        const portalByKey = _.keyBy(
            allPortalMedia.filter((m) => m.key),
            (m) => m.key
        );

        const allLocalMedia = mobileNotes.allMedia();
        const localByKey = _.keyBy(
            allLocalMedia.filter((m) => m.key),
            (m) => m.key
        );

        const allKeys = _.union(_.flatten([Object.keys(localByKey), Object.keys(portalByKey)]));

        console.log(`notes: ${JSON.stringify({ ids, portalByKey, localByKey, allKeys })}`);
        return await serializePromiseChain(allKeys, async (key: string) => {
            if (portalByKey[key]) {
                if (!localByKey[key]) {
                    // Portal has the media and we gotta download.
                    const isPhoto = (mime) => /^image/.test(mime);
                    const getFolder = (mime) => (isPhoto(mime) ? "media/images" : "media/audio");
                    const contentType = portalByKey[key].contentType;
                    const photo = isPhoto(contentType);
                    const folder = this.fs.getFolder(getFolder(contentType));
                    const destination = folder.getFile(this.makeFileNameForPortalDownload(key, contentType));

                    if (destination.exists && destination.size > 0) {
                        console.log(`notes: already on disk`, destination.path, contentType, key);
                        this.store.commit(new AttachNoteMediaMutation(ids.mobile, null, { key: key, path: destination.path }, !photo));
                        return [destination.path, portalByKey[key].id];
                    } else {
                        console.log(`notes: downloading portal media`, destination.path, contentType, key);
                        return await this.portal.downloadStationMedia(portalByKey[key].id, destination.path).then(() => {
                            this.store.commit(new AttachNoteMediaMutation(ids.mobile, null, { key: key, path: destination.path }, !photo));
                            return [destination.path, portalByKey[key].id];
                        });
                    }
                }
                return [localByKey[key].path, portalByKey[key].id];
            }
            const path = localByKey[key].path;
            const contentType = this.getContentType(path);
            const rebasedPath = rebaseAbsolutePath(path);
            return this.portal.uploadStationMedia(ids.portal, key, contentType, rebasedPath).then((response): [string, number] => {
                if (response.status != 200) {
                    new Error(`error uploading media`);
                }
                console.log(`notes: upload done ${JSON.stringify(response)}`);
                return [path, response.data.id];
            });
        }).then((pathAndId: [string, number][]) => {
            const obj = _.fromPairs(pathAndId);
            console.log(`notes: media paths and ids: ${JSON.stringify(obj)}`);
            return obj;
        });
    }

    private merge(ids: Ids, portalNotes: PortalStationNotesReply, mobileNotes: Notes, media: { [index: string]: number }): MergedNotes {
        const portalExisting = _.keyBy(portalNotes.notes, (n) => n.key);
        const localByKey = {
            studyObjective: mobileNotes.studyObjective,
            sitePurpose: mobileNotes.sitePurpose,
            siteCriteria: mobileNotes.siteCriteria,
            siteDescription: mobileNotes.siteDescription,
        };

        console.log(`notes: merging: ${JSON.stringify({ portalExisting, localByKey })}`);

        const modifications = _(localByKey)
            .mapValues((value, key) => {
                const photoIds = value.photos.map((m) => media[m.path]).filter((v) => v);
                const audioIds = value.audio.map((m) => media[m.path]).filter((v) => v);
                const mediaIds = [...photoIds, ...audioIds];

                if (portalExisting[key]) {
                    const localBody = value.body;
                    const remoteBody = portalExisting[key].body;
                    const localEmpty = localBody.length == 0;

                    console.log(
                        `notes: comparing ${JSON.stringify({
                            key,
                            localEmpty,
                            portal: portalExisting[key].updatedAt,
                            mobile: mobileNotes.updatedAt,
                        })}`
                    );
                    if (localBody == remoteBody) {
                        return {
                            creating: null,
                            updating: null,
                        };
                    }

                    const remoteTime = moment(portalExisting[key].updatedAt);
                    const localTime = moment(mobileNotes.updatedAt);

                    if (remoteTime.isAfter(localTime)) {
                        console.log(`notes: portal wins ${JSON.stringify({ key, remoteTime, localTime })}`);
                        this.store.commit(new UpdateNoteMutation(ids.mobile, key, portalExisting[key]));
                        return {
                            creating: null,
                            updating: null,
                        };
                    }
                    console.log(`notes: mobile wins ${JSON.stringify({ key, remoteTime, localTime })}`);
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
        const modified = this.store.state.notes.stations[ids.mobile]?.modified || false;

        return new MergedNotes(new PatchPortalNotes(creating, updating), modified);
    }
}
