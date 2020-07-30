import * as ActionTypes from "./actions";

export class AddStationNetworkAction {
    type = ActionTypes.CONFIGURE_STATION_NETWORK;

    constructor(public readonly deviceId: string, public readonly ssid: string, public readonly password: string) {}
}
