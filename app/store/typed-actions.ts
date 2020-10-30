import * as ActionTypes from "./actions";
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
