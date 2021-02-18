import _ from "lodash";
import { NearbyState } from "./nearby";
import { MapState } from "./map";
import { NavigationState } from "./nav";
import { PhoneState } from "./phone";
import { NetworkState } from "./network";
import { SyncingState } from "./syncing";
import { NotesState } from "./notes";
import { CurrentUser, PortalState } from "./portal";
import { FirmwareState } from "./firmware";
import { NotificationsState } from "./notifications";
import { MediaState } from "./media";
import {
    ServiceInfo,
    ModuleConfiguration,
    Station,
    AvailableStation,
    LegacyStation,
    StationSyncStatus,
    DiscoveringStation,
} from "../types";
import { StationCalibration } from "../../calibration";

export class StationsState {
    all: Station[] = [];
}

export class PendingCalibrationPoint {
    constructor(public readonly index: number, public readonly references: number[], public readonly uncalibrated: number[]) {}
}

export class PendingCalibration {
    constructor(public readonly moduleId: string, public readonly points: PendingCalibrationPoint[] = []) {}

    public append(pcp: PendingCalibrationPoint): PendingCalibration {
        const newPoints = _.clone(this.points);
        newPoints[pcp.index] = pcp;
        return new PendingCalibration(this.moduleId, newPoints);
    }
}

export class CalibrationState {
    configurations: { [index: string]: ModuleConfiguration } = {};
    connected: { [index: string]: ServiceInfo } = {};
    pending: { [index: string]: PendingCalibration } = {};
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
    readonly cal: CalibrationState;
    readonly media: MediaState;
}

export interface GlobalGetters {
    readonly availableStations: AvailableStation[];
    readonly availableStationsById: { [id: number]: AvailableStation };
    readonly legacyStations: { [index: string]: LegacyStation };
    readonly syncs: StationSyncStatus[];
    readonly stationCalibrations: { [index: number]: StationCalibration };
    readonly usersById: { [id: number]: CurrentUser };
    readonly directlyConnected: boolean;
    // TODO Deprecate
    readonly stationsById: { [index: number]: Station };
    readonly discovering: DiscoveringStation[];
}
