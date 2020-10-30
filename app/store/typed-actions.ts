import * as ActionTypes from "./actions";
import * as MutationTypes from "./mutations";
import { ServiceInfo } from "@/store/types";
import { NetworkInfo, HttpStatusReply } from "@/store/http_reply";

export class TryStationAction {
    type = ActionTypes.TRY_STATION;

    constructor(public readonly info: ServiceInfo) {}
}

export class TryStationOnceAction {
    type = ActionTypes.TRY_STATION_ONCE;

    constructor(public readonly info: ServiceInfo) {}
}

export class StationRepliedAction {
    type = ActionTypes.STATION_REPLY;

    constructor(public readonly statusReply: HttpStatusReply, public readonly url: string) {}
}

export class ConfigureStationNetworksAction {
    type = ActionTypes.CONFIGURE_STATION_SET_NETWORKS;

    constructor(public readonly deviceId: string, public readonly networks: NetworkInfo[]) {}
}

export class AddStationNetworkAction {
    type = ActionTypes.CONFIGURE_STATION_ADD_NETWORK;

    constructor(public readonly deviceId: string, public readonly adding: NetworkInfo, public readonly networks: NetworkInfo[]) {}
}

export class RemoveStationNetworkAction {
    type = ActionTypes.CONFIGURE_STATION_REMOVE_NETWORK;

    constructor(public readonly deviceId: string, public readonly removing: NetworkInfo, public readonly networks: NetworkInfo[]) {}
}

export interface PortalEnv {
    name: string | null;
    baseUri: string;
    ingestionUri: string;
}

export class ChangePortalEnvAction {
    type = ActionTypes.CHANGE_PORTAL_ENV;

    constructor(public readonly env: PortalEnv) {}
}

export class NoteMedia {
    constructor(public readonly path: string, public readonly key: string) {}

    public static except(media: NoteMedia[], removing: NoteMedia): NoteMedia[] {
        return media.filter((m) => m.path !== removing.path);
    }

    public static onlyAudio(media: NoteMedia[]): NoteMedia[] {
        return media.filter(NoteMedia.isAudio.bind(this));
    }

    public static onlyPhotos(media: NoteMedia[]): NoteMedia[] {
        return media.filter(NoteMedia.isPhoto.bind(this));
    }

    public static isPhoto(nm: NoteMedia): boolean {
        return !NoteMedia.isAudio(nm);
    }

    public static isAudio(nm: NoteMedia): boolean {
        return /(m4a|caf)$/.test(nm.path.toLowerCase());
    }
}

export class NoteHelp {
    constructor(public readonly title: string, public readonly instructions: string) {}
}

export class NoteData {
    constructor(public readonly body: string = "", public photos: NoteMedia[] = [], public audio: NoteMedia[] = []) {}
}

export class NoteForm {
    constructor(
        public readonly help: NoteHelp,
        public readonly body: string = "",
        public photos: NoteMedia[] = [],
        public audio: NoteMedia[] = []
    ) {}
}

export interface NoteUpdate {
    body: string;
}

export class UpdateNoteMutation {
    type = MutationTypes.UPDATE_NOTE;

    constructor(public readonly stationId: number, public readonly key: string, public readonly update: NoteUpdate) {}
}
