import {
    PortalUpdater,
    Conservify,
    PortalInterface,
    AudioInterface,
    ImagesSaver,
    FileSystem,
    QueryStation,
    DatabaseInterface,
    DiscoverStation,
    StationFirmware,
} from "./all";

import { Services } from "./interface";

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

    public audio(): AudioInterface {
        return this.verify().Audio();
    }

    public firmware(): StationFirmware {
        return this.verify().StationFirmware();
    }

    public images(): ImagesSaver {
        return this.verify().Images();
    }

    private verify(): Services {
        if (!this.services) {
            throw new Error(`Services unfilled`);
        }
        return this.services();
    }
}
