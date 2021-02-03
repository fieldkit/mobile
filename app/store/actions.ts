import { NetworkInfo, HttpStatusReply } from "@/store/http-types";
import { ServiceInfo, PortalEnv, Schedules, Schedule, StationSyncStatus, PhoneNetwork, StationPortalStatus, PortalError } from "./types";
import { IBackOffOptions } from "exponential-backoff";

export enum ActionTypes {
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

    REGISTER = "REGISTER",
    LOGIN = "LOGIN",
    AUTHENTICATED = "AUTHENTICATED",
    REFRESH_ACCOUNTS = "REFRESH_ACCOUNTS",
    REMOVE_ACCOUNT = "REMOVE_ACCOUNT",
    SYNC_ACCOUNT = "SYNC_ACCOUNT",

    REFRESH = "REFRESH",

    SCAN_FOR_STATIONS = "SCAN_FOR_STATIONS",

    UPLOAD_ALL = "UPLOAD_ALL",
    UPLOAD_STATION = "UPLOAD_STATION",

    DOWNLOAD_ALL = "DOWNLOAD_ALL",
    DOWNLOAD_STATION = "DOWNLOAD_STATION",

    FIRMWARE_REFRESH = "FIRMWARE_REFRESH",

    REFRESH_NETWORK = "REFRESH_NETWORK",
    NETWORK_CHANGED = "NETWORK_CHANGED",

    // Media

    AUDIO_RECORD = "AUDIO_RECORD",
    AUDIO_PAUSE = "AUDIO_PAUSE",
    AUDIO_RESUME = "AUDIO_RESUME",
    AUDIO_STOP = "AUDIO_STOP",
    LOAD_PICTURES = "LOAD_PICTURES",

    // Deploy

    RENAME_STATION = "RENAME_STATION",
    CONFIGURE_STATION_SET_NETWORKS = "CONFIGURE_STATION_SET_NETWORKS",
    CONFIGURE_STATION_ADD_NETWORK = "CONFIGURE_STATION_ADD_NETWORK",
    CONFIGURE_STATION_REMOVE_NETWORK = "CONFIGURE_STATION_REMOVE_NETWORK",
    CONFIGURE_STATION_SCHEDULES = "CONFIGURE_STATION_SCHEDULES",
    STATION_LOCATION = "STATION_LOCATION",
    SCAN_STATION_NETWORKS = "SCAN_STATION_NETWORKS",
    SCAN_STATION_MODULES = "SCAN_STATION_MODULES",

    UPDATE_NOTES_FORM = "UPDATE_NOTES_FORM",
    DEPLOY_STATION = "DEPLOY_STATION",
    END_STATION_DEPLOYMENT = "END_STATION_DEPLOYMENT",
    SAVE_NOTES = "SAVE_NOTES",

    UPGRADE_STATION_FIRMWARE = "UPGRADE_STATION_FIRMWARE",

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

    constructor(public readonly info: ServiceInfo, public readonly backOffOptions: Partial<IBackOffOptions> | undefined = undefined) {}
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

export class ConfigureStationSchedulesAction {
    type = ActionTypes.CONFIGURE_STATION_SCHEDULES;

    constructor(
        public readonly deviceId: string,
        public readonly modifying: { readings?: Schedule; network?: Schedule },
        public readonly existing: Schedules
    ) {}
}

export class AddStationNetworkAction {
    type = ActionTypes.CONFIGURE_STATION_ADD_NETWORK;

    constructor(public readonly deviceId: string, public readonly adding: NetworkInfo, public readonly networks: NetworkInfo[]) {}
}

export class RemoveStationNetworkAction {
    type = ActionTypes.CONFIGURE_STATION_REMOVE_NETWORK;

    constructor(public readonly deviceId: string, public readonly removing: NetworkInfo, public readonly networks: NetworkInfo[]) {}
}

export class ChangePortalEnvAction {
    type = ActionTypes.CHANGE_PORTAL_ENV;

    constructor(public readonly env: PortalEnv) {}
}

export class ScanForStationsAction {
    type = ActionTypes.SCAN_FOR_STATIONS;

    constructor(public readonly flags: { user?: boolean; wifi?: boolean }) {}
}

export class LoginAction {
    type = ActionTypes.LOGIN;

    constructor(public readonly email: string, public readonly password: string) {}
}

export class RegisterAction {
    type = ActionTypes.REGISTER;

    constructor(public readonly name: string, public readonly email: string, public readonly password: string) {}
}

export class NameStationLocationAction {
    type = ActionTypes.STATION_LOCATION;

    constructor(public readonly stationId: number, public readonly location: string) {}
}

export class SaveNotesAction {
    type = ActionTypes.SAVE_NOTES;

    constructor(public readonly stationId: number) {}
}

export class ScanStationModulesAction {
    type = ActionTypes.SCAN_STATION_MODULES;

    constructor(public readonly stationId: number) {}
}

export class UpgradeStationFirmwareAction {
    type = ActionTypes.UPGRADE_STATION_FIRMWARE;

    constructor(public readonly stationId: number, public readonly url: string) {}
}

export class DownloadStationDataAction {
    type = ActionTypes.DOWNLOAD_STATION;

    constructor(public readonly sync: StationSyncStatus) {}
}

export class UploadStationDataAction {
    type = ActionTypes.UPLOAD_STATION;

    constructor(public readonly sync: StationSyncStatus) {}
}

export class DownloadAllStationsDataAction {
    type = ActionTypes.DOWNLOAD_ALL;

    constructor(public readonly syncs: StationSyncStatus[]) {}
}

export class UploadAllStationsDataAction {
    type = ActionTypes.UPLOAD_ALL;

    constructor(public readonly syncs: StationSyncStatus[]) {}
}

export class RefreshNetworkAction {
    type = ActionTypes.REFRESH_NETWORK;
}

export class NetworkChangedAction {
    type = ActionTypes.NETWORK_CHANGED;

    constructor(public readonly network: PhoneNetwork) {}
}

export class PortalReplyAction implements StationPortalStatus {
    type = ActionTypes.STATION_PORTAL_REPLY;

    public readonly error = null;

    constructor(
        public readonly userId: number,
        public readonly id: number,
        public readonly portalId: number,
        public readonly ownerId: number
    ) {}
}

export class PortalErrorAction implements StationPortalStatus {
    type = ActionTypes.STATION_PORTAL_ERROR;

    public readonly portalId = null;
    public readonly ownerId = null;

    constructor(public readonly id: number, public readonly error: PortalError) {}
}

export class RenameStationAction {
    type = ActionTypes.RENAME_STATION;

    constructor(public readonly deviceId: string, public readonly name: string) {}
}

export class RemoveAccountAction {
    type = ActionTypes.REMOVE_ACCOUNT;

    constructor(public readonly email: string) {}
}

export class SyncAccountAction {
    type = ActionTypes.SYNC_ACCOUNT;

    constructor(public readonly email: string) {}
}
