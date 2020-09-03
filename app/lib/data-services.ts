import { Services, ServiceFactories } from "@/services/services";
import { FileLike } from "@/lib/fs";

type DelimitedCallback = (position: number, size: number, records: any) => void;

interface TinyServices {
    open(path: string): Promise<ConservifyFile>;
    listFolder(path: string): Promise<FileLike[]>;
}

interface ConservifyFile {
    delimited(callback: DelimitedCallback): Promise<any>;
}

class DataServicesAdapter implements TinyServices {
    constructor(private readonly services: Services) {
        this.services.Conservify();
        this.services.FileSystem();
    }

    public open(path: string): Promise<ConservifyFile> {
        return this.services.Conservify().open(path);
    }

    public listFolder(path: string): Promise<FileLike[]> {
        return this.services.FileSystem().listFolder(path);
    }
}

class WorkerDataServices implements TinyServices {
    private readonly fs: any;
    private readonly conservify: any;

    constructor() {
        const factories = new ServiceFactories();
        this.fs = factories.createFileSystem();
        this.conservify = factories.createConservify();
    }

    public open(path: string): Promise<ConservifyFile> {
        return this.conservify.open(path);
    }

    public listFolder(path: string): Promise<FileLike[]> {
        return this.fs.listFolder(path);
    }
}

export type DataServices = () => TinyServices;

export function createDataServices(): DataServices {
    const dataServices = new WorkerDataServices();
    return () => dataServices;
}

export function createAdaptedDataServices(services: Services): DataServices {
    const dataServices = new DataServicesAdapter(services);
    return () => dataServices;
}
