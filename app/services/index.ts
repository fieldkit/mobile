import { OurStore } from "@/store";

import PortalInterface from "./portal-interface";
import PortalUpdater from "./portal-updater";
import DiscoverStation from "./discover-station";
import DatabaseInterface from "./db-interface";
import QueryStation from "./query-station";
import PhoneLocation from "./phone-location";
import StationFirmware from "./station-firmware";
import CreateDb from "./create-db";
import ImagesSaver from "./images-saver";
import AudioInterface from "./audio-interface";
import { TaskQueue } from "@/lib/tasks";

export * from "./portal-interface";
export * from "./portal-updater";
export * from "./discover-station";
export * from "./db-interface";
export * from "./query-station";
export * from "./services";

export interface FileSystem {
    getFolder(path: string): any;
    getFile(path: string): any;
    listFolder(path: string): any;
}

export interface LegacyHooks {}

export interface Conservify {
    open(path: string): any;
    download(info: any): Promise<any>;
}

export interface Services {
    Database(): DatabaseInterface;
    QueryStation(): QueryStation;
    FileSystem(): FileSystem;
    PortalInterface(): PortalInterface;
    PortalUpdater(): PortalUpdater;
    DiscoverStation(): DiscoverStation;
    Conservify(): Conservify;
    StationFirmware(): StationFirmware;
    Audio(): AudioInterface;
    Images(): ImagesSaver;
    Store(): OurStore;
    Tasks(): TaskQueue;
    CreateDb(): CreateDb;
    PhoneLocation(): PhoneLocation;
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
