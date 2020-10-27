import {
    PortalInterface,
    PortalUpdater,
    DiscoverStation,
    DatabaseInterface,
    Diagnostics,
    QueryStation,
    PhoneLocation,
    CalibrationService,
    StationFirmware,
    CreateDb,
    ImagesSaver,
    AudioInterface,
    TaskQueue,
    Conservify,
    FileSystem,
    OurStore,
    DiscoveryEvents,
} from "./all";

export interface Services {
    Database(): DatabaseInterface;
    QueryStation(): QueryStation;
    FileSystem(): FileSystem;
    PortalInterface(): PortalInterface;
    PortalUpdater(): PortalUpdater;
    DiscoverStation(): DiscoverStation;
    Diagnostics(): Diagnostics;
    Conservify(): Conservify;
    StationFirmware(): StationFirmware;
    Audio(): AudioInterface;
    Images(): ImagesSaver;
    Store(): OurStore;
    Tasks(): TaskQueue;
    CalibrationService(): CalibrationService;
    CreateDb(): CreateDb;
    PhoneLocation(): PhoneLocation;
    DiscoveryEvents(): DiscoveryEvents;
}
