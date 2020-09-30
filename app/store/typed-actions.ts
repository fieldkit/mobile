import * as ActionTypes from "./actions";
import { ServiceInfo } from "@/store/types";
import { HttpStatusReply } from "@/store/http_reply";

export class AddStationNetworkAction {
    type = ActionTypes.CONFIGURE_STATION_NETWORK;

    constructor(public readonly deviceId: string, public readonly ssid: string, public readonly password: string) {}
}

export class TryStationAction {
    type = ActionTypes.TRY_STATION;

    constructor(public readonly info: ServiceInfo) {}
}

/*
export class AttachNoteMediaAction {
    type = ActionTypes.ATTACH_NOTE_MEDIA;

    constructor(public readonly stationId: number, key: string | null, audio: NoteMedia | null, photo: NoteMedia | null) {}
}

export class RemoteNoteMediaAction {
    type = ActionTypes.REMOVE_NOTE_MEDIA;

    constructor(public readonly stationId: number, public readonly key: string | null, public readonly audio: NoteMedia) {}
}
*/

export class StationRepliedAction {
    type = ActionTypes.STATION_REPLY;

    constructor(public readonly statusReply: HttpStatusReply, public readonly url: string) {}
}
