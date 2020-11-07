import Config from "@/config";

import {
    PortalInterface,
    PortalUpdater,
    DiscoverStation,
    DatabaseInterface,
    Diagnostics,
    QueryStation,
    PhoneLocation,
    StationFirmware,
    CalibrationService,
    CreateDb,
    ImagesSaver,
    AudioInterface,
    TaskQueue,
    Conservify,
    FileSystem,
    OurStore,
    DiscoveryEvents,
} from "./all";

import storeFactory from "@/store";
import { Services } from "./interface";

export class ServiceFactories {
    public createFileSystem(): FileSystem {
        return new FileSystem();
    }

    public createConservify(discoveryEvents: DiscoveryEvents = new DiscoveryEvents()): Conservify {
        const logger = Config.logger("NativeScriptConservify").info; // eslint-disable-line
        return new Conservify(discoveryEvents, logger);
    }
}

export class ServicesImpl implements Services {
    private store: OurStore | null = null;
    private tasks: TaskQueue | null = null;
    private discoverStation: DiscoverStation | null = null;
    private diagnostics: Diagnostics | null = null;
    private database: DatabaseInterface | null = null;
    private queryStation: QueryStation | null = null;
    private createDb: CreateDb | null = null;
    private portalInterface: PortalInterface | null = null;
    private portalUpdater: PortalUpdater | null = null;
    private fileSystem: FileSystem | null = null;
    private calibrationService: CalibrationService | null = null;
    private stationFirmware: StationFirmware | null = null;
    private conservify: Conservify | null = null;
    private phoneLocation: PhoneLocation | null = null;
    private images: ImagesSaver | null = null;
    private audioInterface: AudioInterface | null = null;
    private discoveryEvents: DiscoveryEvents | null = null;

    private unwrap<T>(value: T | null): T {
        if (!value) throw new Error("uninitialized");
        return value;
    }

    public Store(): OurStore {
        if (!this.store) {
            this.store = storeFactory(this);
        }
        return this.store;
    }

    public Tasks(): TaskQueue {
        if (!this.tasks) {
            // const StandardWorker = require("nativescript-worker-loader!@/lib/worker"); // eslint-disable-line
            // console.log("worker", StandardWorker);
            this.tasks = new TaskQueue();
            // this.tasks.start(1, StandardWorker);
        }
        return this.unwrap(this.tasks);
    }

    public DiscoverStation(): DiscoverStation {
        if (!this.discoverStation) {
            this.discoverStation = new DiscoverStation(this);
        }
        return this.unwrap(this.discoverStation);
    }

    public Diagnostics(): Diagnostics {
        if (!this.diagnostics) {
            this.diagnostics = new Diagnostics(this);
        }
        return this.unwrap(this.diagnostics);
    }

    public Database(): DatabaseInterface {
        if (!this.database) {
            this.database = new DatabaseInterface(this);
        }
        return this.unwrap(this.database);
    }

    public QueryStation(): QueryStation {
        if (!this.queryStation) {
            this.queryStation = new QueryStation(this);
        }
        return this.unwrap(this.queryStation);
    }

    public CreateDb(): CreateDb {
        if (!this.createDb) {
            this.createDb = new CreateDb();
        }
        return this.unwrap(this.createDb);
    }

    public PortalInterface(): PortalInterface {
        if (!this.portalInterface) {
            this.portalInterface = new PortalInterface(this);
        }
        return this.unwrap(this.portalInterface);
    }

    public PortalUpdater(): PortalUpdater {
        if (!this.portalUpdater) {
            this.portalUpdater = new PortalUpdater(this.PortalInterface(), this.Store(), this.FileSystem());
        }
        return this.unwrap(this.portalUpdater);
    }

    public Conservify(): Conservify {
        if (!this.conservify) {
            const logger = Config.logger("NativeScriptConservify").info; // eslint-disable-line
            this.conservify = new Conservify(this.DiscoveryEvents(), logger);
        }
        return this.unwrap(this.conservify);
    }

    public DiscoveryEvents(): DiscoveryEvents {
        if (!this.discoveryEvents) {
            this.discoveryEvents = new DiscoveryEvents();
        }
        return this.unwrap(this.discoveryEvents);
    }

    public PhoneLocation(): PhoneLocation {
        if (!this.phoneLocation) {
            this.phoneLocation = new PhoneLocation(this.Store());
        }
        return this.unwrap(this.phoneLocation);
    }

    public StationFirmware(): StationFirmware {
        if (!this.stationFirmware) {
            this.stationFirmware = new StationFirmware(this);
        }
        return this.unwrap(this.stationFirmware);
    }

    public FileSystem(): FileSystem {
        if (!this.fileSystem) {
            this.fileSystem = new FileSystem();
        }
        return this.unwrap(this.fileSystem);
    }

    public CalibrationService(): CalibrationService {
        if (!this.calibrationService) {
            this.calibrationService = new CalibrationService(this.Conservify());
        }
        return this.unwrap(this.calibrationService);
    }

    public Audio(): AudioInterface {
        if (!this.audioInterface) {
            this.audioInterface = new AudioInterface();
        }
        return this.unwrap(this.audioInterface);
    }

    public Images(): ImagesSaver {
        if (!this.images) {
            this.images = new ImagesSaver();
        }
        return this.unwrap(this.images);
    }
}
