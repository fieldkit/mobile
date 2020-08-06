import PortalInterface from "../../services/portal-interface";
import PortalUpdater from "../../services/portal-updater";
import DiscoverStation from "../../services/discover-station";

export interface Services {
    Database(): any;
    QueryStation(): any;
    LegacyHooks(): any;
    FileSystem(): any;
    PortalInterface(): PortalInterface;
    PortalUpdater(): PortalUpdater;
    DiscoverStation(): DiscoverStation;
    Conservify(): any;
    StationFirmware(): any;
    Audio(): any;
    Images(): any;
}

export type ServicesFactory = () => Services;

export class ServiceRef {
    constructor(private readonly services: ServicesFactory | null = null) {}

    public db(): any {
        return this.verify().Database();
    }

    public queryStation(): any {
        return this.verify().QueryStation();
    }

    public fs(): any {
        return this.verify().FileSystem();
    }

    public portal(): any {
        return this.verify().PortalInterface();
    }

    public updater(): any {
        return this.verify().PortalUpdater();
    }

    public conservify(): any {
        return this.verify().Conservify();
    }

    public discovery(): any {
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
