export * from "./portal-interface";
export * from "./portal-updater";
export * from "./discover-station";
export * from "./db-interface";
export * from "./query-station";

import PortalInterface from "./portal-interface";
import PortalUpdater from "./portal-updater";
import DiscoverStation from "./discover-station";
import DatabaseInterface from "./db-interface";
import QueryStation from "./query-station";

export interface FileSystem {
    getFolder(path: string): any;
}

export interface LegacyHooks {}

export interface Conservify {}

export interface Services {
    Database(): DatabaseInterface;
    QueryStation(): QueryStation;
    FileSystem(): FileSystem;
    PortalInterface(): PortalInterface;
    PortalUpdater(): PortalUpdater;
    DiscoverStation(): DiscoverStation;
    Conservify(): Conservify;
    StationFirmware(): any;
    Audio(): any;
    Images(): any;
}

export type ServicesFactory = () => Services;

export class ServiceRef {
    constructor(private readonly services: ServicesFactory) {}

    public db(): DatabaseInterface {
        return this.verify().Database();
    }

    public queryStation(): QueryStation {
        return this.verify().QueryStation();
    }

    public fs(): FileSystem {
        return this.verify().FileSystem();
    }

    public portal(): PortalInterface {
        return this.verify().PortalInterface();
    }

    public updater(): PortalUpdater {
        return this.verify().PortalUpdater();
    }

    public conservify(): Conservify {
        return this.verify().Conservify();
    }

    public discovery(): DiscoverStation {
        return this.verify().DiscoverStation();
    }

    public audio(): any {
        return this.verify().Audio();
    }

    public firmware(): any {
        return this.verify().StationFirmware();
    }

    public images(): any {
        return this.verify().Images();
    }

    private verify(): Services {
        if (!this.services) {
            throw new Error(`Services unfilled`);
        }
        return this.services();
    }
}
