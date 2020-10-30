import { ServiceInfo } from "@/store/types";
import { NetworkInfo, HttpStatusReply } from "@/store/http_reply";

export enum ActionTypes {
    INITIALIZE = "INITIALIZE",

    LOAD = "LOAD",
    SAVE = "SAVE",
    UPDATE = "SAVE",
    LOAD_STATIONS = "LOAD_STATIONS",
    STATIONS_LOADED = "STATIONS_LOADED",

    FOUND = "FOUND",
    MAYBE_LOST = "MAYBE_LOST",
    LOST = "LOST",

    QUERY_NECESSARY = "QUERY_NECESSARY",
    QUERY_STATION = "QUERY_STATION",
    TRY_STATION = "TRY_STATION",
    TRY_STATION_ONCE = "TRY_STATION_ONCE",
    STATION_REPLY = "STATION_REPLY",

    STATION_PORTAL_ERROR = "STATION_PORTAL_ERROR",
    STATION_PORTAL_REPLY = "STATION_PORTAL_REPLY",

    AUTHENTICATED = "AUTHENTICATED",

    REFRESH = "REFRESH",

    SCAN_FOR_STATIONS = "SCAN_FOR_STATIONS",

    UPLOAD_ALL = "UPLOAD_ALL",
    UPLOAD_STATION = "UPLOAD_STATION",

    DOWNLOAD_ALL = "DOWNLOAD_ALL",
    DOWNLOAD_STATION = "DOWNLOAD_STATION",

    FIRMWARE_REFRESH = "FIRMWARE_REFRESH",

    // Media

    AUDIO_RECORD = "AUDIO_RECORD",
    AUDIO_PAUSE = "AUDIO_PAUSE",
    AUDIO_RESUME = "AUDIO_RESUME",
    AUDIO_STOP = "AUDIO_STOP",

    TAKE_PICTURE = "TAKE_PICTURE",
    FIND_PICTURE = "FIND_PICTURE",
    SAVE_PICTURE = "SAVE_PICTURE",
    LOAD_PICTURES = "LOAD_PICTURES",

    // Deploy

    RENAME_STATION = "RENAME_STATION",
    CONFIGURE_STATION_SET_NETWORKS = "CONFIGURE_STATION_SET_NETWORKS",
    CONFIGURE_STATION_ADD_NETWORK = "CONFIGURE_STATION_ADD_NETWORK",
    CONFIGURE_STATION_REMOVE_NETWORK = "CONFIGURE_STATION_REMOVE_NETWORK",
    CONFIGURE_STATION_SCHEDULES = "CONFIGURE_STATION_SCHEDULES",
    STATION_LOCATION = "STATION_LOCATION",
    SCAN_STATION_NETWORKS = "SCAN_STATION_NETWORKS",

    UPDATE_NOTES_FORM = "UPDATE_NOTES_FORM",
    DEPLOY_STATION = "DEPLOY_STATION",
    END_STATION_DEPLOYMENT = "END_STATION_DEPLOYMENT",
    SAVE_NOTES = "SAVE_NOTES",

    // Portal

    UPDATE_PORTAL = "UPDATE_PORTAL",

    // Calibration

    CALIBRATE_SENSOR = "CALIBRATE_SENSOR",
    CLEAR_SENSOR_CALIBRATION = "CLEAR_SENSOR_CALIBRATION",

    LOAD_SETTINGS = "LOAD_SETTINGS",
    UPDATE_SETTINGS = "UPDATE_SETTINGS",

    LOAD_ACCOUNTS = "LOAD_ACCOUNTS",
    UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
    LOGOUT_ACCOUNTS = "LOGOUT_ACCOUNTS",
    CHANGE_ACCOUNT = "CHANGE_ACCOUNT",

    // Notifications

    LOAD_NOTIFICATIONS = "LOAD_NOTIFICATIONS",
    ADD_NOTIFICATION = "ADD_NOTIFICATION",
    UPDATE_NOTIFICATION = "UPDATE_NOTIFICATION",
    DISMISS_NOTIFICATION = "DISMISS_NOTIFICATION",
    SATISFY_NOTIFICATION = "SATISFY_NOTIFICATION",

    RELOAD_FIRMWARE = "RELOAD_FIRMWARE",

    // Portal Envs

    CHANGE_PORTAL_ENV = "CHANGE_PORTAL_ENV",
    LOAD_PORTAL_ENVS = "LOAD_PORTAL_ENVS",
}

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

export class SaveNotesAction {
    type = ActionTypes.SAVE_NOTES;

    constructor(public readonly stationId: number) {}
}
