export interface Services {
    Database(): any;
    QueryStation(): any;
    LegacyHooks(): any;
    FileSystem(): any;
    PortalInterface(): any;
    StationFirmware(): any;
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

    public legacy(): any {
        return this.verify().LegacyHooks();
    }

    public fs(): any {
        return this.verify().FileSystem();
    }

    public portal(): any {
        return this.verify().PortalInterface();
    }

    public firmware(): any {
        return this.verify().StationFirmware();
    }

    private verify(): Services {
        if (!this.services) {
            throw new Error(`Services unfilled`);
        }
        return this.services();
    }
}
