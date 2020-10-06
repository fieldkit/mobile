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
} from "./all";

import storeFactory from "@/store";
import { Services } from "./interface";
import { DiscoveryEvents } from "./discovery-events";

export class ServiceFactories {
    public createFileSystem(): FileSystem {
        const FileSystem = require("../wrappers/file-system").default;
        return new FileSystem();
    }

    public createConservify(discoveryEvents: DiscoveryEvents = new DiscoveryEvents()): Conservify {
        const logger = Config.logger("NativeScriptConservify").noop;
        const Conservify = require("../wrappers/networking").default;
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
            const StandardWorker = require("nativescript-worker-loader!@/lib/worker");
            console.log("worker", StandardWorker);
            this.tasks = new TaskQueue();
            this.tasks.start(1, StandardWorker);
        }
        return this.unwrap(this.tasks);
    }

    public DiscoverStation(): DiscoverStation {
        if (!this.discoverStation) {
            const DiscoverStation = require("./discover-station").default;
            this.discoverStation = new DiscoverStation(this);
        }
        return this.unwrap(this.discoverStation);
    }

    public Diagnostics(): Diagnostics {
        if (!this.diagnostics) {
            const Diagnostics = require("./diagnostics-service").default;
            this.diagnostics = new Diagnostics(this);
        }
        return this.unwrap(this.diagnostics);
    }

    public Database(): DatabaseInterface {
        if (!this.database) {
            const DatabaseInterface = require("./db-interface").default;
            this.database = new DatabaseInterface(this);
        }
        return this.unwrap(this.database);
    }

    public QueryStation(): QueryStation {
        if (!this.queryStation) {
            const QueryStation = require("./query-station").default;
            this.queryStation = new QueryStation(this);
        }
        return this.unwrap(this.queryStation);
    }

    public CreateDb(): CreateDb {
        if (!this.createDb) {
            const CreateDb = require("./create-db").default;
            this.createDb = new CreateDb(this.Database());
        }
        return this.unwrap(this.createDb);
    }

    public PortalInterface(): PortalInterface {
        if (!this.portalInterface) {
            const PortalInterface = require("./portal-interface").default;
            this.portalInterface = new PortalInterface(this);
        }
        return this.unwrap(this.portalInterface);
    }

    public PortalUpdater(): PortalUpdater {
        if (!this.portalUpdater) {
            const PortalUpdater = require("./portal-updater").default;
            this.portalUpdater = new PortalUpdater(this.PortalInterface(), this.Store(), this.FileSystem());
        }
        return this.unwrap(this.portalUpdater);
    }

    public Conservify(): Conservify {
        if (!this.conservify) {
            const logger = Config.logger("NativeScriptConservify").noop;
            const Conservify = require("../wrappers/networking").default;
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
            const PhoneLocation = require("./phone-location").default;
            this.phoneLocation = new PhoneLocation(this.Store());
        }
        return this.unwrap(this.phoneLocation);
    }

    public StationFirmware(): StationFirmware {
        if (!this.stationFirmware) {
            const StationFirmware = require("./station-firmware").default;
            this.stationFirmware = new StationFirmware(this);
        }
        return this.unwrap(this.stationFirmware);
    }

    public FileSystem(): FileSystem {
        if (!this.fileSystem) {
            const FileSystem = require("../wrappers/file-system").default;
            this.fileSystem = new FileSystem();
        }
        return this.unwrap(this.fileSystem);
    }

    public CalibrationService(): CalibrationService {
        if (!this.calibrationService) {
            const CalibrationService = require("./calibration-service").default;
            this.calibrationService = new CalibrationService(this.Conservify());
        }
        return this.unwrap(this.calibrationService);
    }

    public Audio(): AudioInterface {
        if (!this.audioInterface) {
            const AudioInterface = require("./audio-interface").default;
            this.audioInterface = new AudioInterface(this);
        }
        return this.unwrap(this.audioInterface);
    }

    public Images(): ImagesSaver {
        if (!this.images) {
            const ImagesSaver = require("./images-saver").default;
            this.images = new ImagesSaver(this);
        }
        return this.unwrap(this.images);
    }
}
