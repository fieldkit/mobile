import { NearbyState } from "./nearby";
import { StationsState } from "./stations";
import { ClockState } from "./clock";
import { MapState } from "./map";
import { NavigationState } from "./nav";
import { PhoneState } from "./phone";
import { NetworkState } from "./network";
import { SyncingState } from "./syncing";

export interface GlobalState {
    readonly nearby: NearbyState;
    readonly stations: StationsState;
    readonly clock: ClockState;
    readonly map: MapState;
    readonly nav: NavigationState;
    readonly phone: PhoneState;
    readonly network: NetworkState;
    readonly synicng: SyncingState;
}
