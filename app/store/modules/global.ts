import { NearbyState } from "./nearby";
import { StationsState } from "./stations";
import { MapState } from "./map";
import { NavigationState } from "./nav";
import { PhoneState } from "./phone";
import { NetworkState } from "./network";
import { SyncingState } from "./syncing";
import { NotesState } from "./notes";
import { PortalState } from "./portal";

import { AvailableStation, LegacyStation } from "../types";

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
}

export interface GlobalGetters {
    readonly availableStations: AvailableStation[];
    readonly legacyStations: { [index: string]: LegacyStation };
}
