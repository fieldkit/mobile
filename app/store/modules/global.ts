import { NearbyState } from "./nearby";
import { MapState } from "./map";
import { NavigationState } from "./nav";
import { PhoneState } from "./phone";
import { NetworkState } from "./network";
import { SyncingState } from "./syncing";
import { NotesState } from "./notes";
import { PortalState } from "./portal";
import { FirmwareState } from "./firmware";
import { NotificationsState } from "./notifications";

import { Station, AvailableStation, LegacyStation } from "../types";

export class StationsState {
    all: Station[] = [];
}

export interface GlobalState {
    readonly nearby: NearbyState;
    readonly stations: StationsState;
    readonly map: MapState;
    readonly nav: NavigationState;
    readonly phone: PhoneState;
    readonly network: NetworkState;
    readonly syncing: SyncingState;
    readonly notes: NotesState;
    readonly portal: PortalState;
    readonly notifications: NotificationsState;
    readonly firmware: FirmwareState;
}

export interface GlobalGetters {
    readonly availableStations: AvailableStation[];
    readonly legacyStations: { [index: string]: LegacyStation };
}
