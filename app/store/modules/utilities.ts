export interface Services {
    Database(): any;
    QueryStation(): any;
    LegacyHooks(): any;
    FileSystem(): any;
}

export type ServicesFactory = () => Services;

export class ServiceRef {
    constructor(private readonly services: ServicesFactory | null = null) {}

    db(): any {
        return this.verify().Database();
    }

    queryStation(): any {
        return this.verify().QueryStation();
    }

    legacy(): any {
        return this.verify().LegacyHooks();
    }

    fs(): any {
        return this.verify().FileSystem();
    }

    private verify(): Services {
        if (!this.services) {
            throw new Error(`Services unfilled`);
        }
        return this.services();
    }
}
