import Services from "@/services/services";
import { FileLike } from "@/lib/fs";

type DelimitedCallback = (position: number, size: number, records: any) => void;

interface ConservifyFile {
    delimited(callback: DelimitedCallback): Promise<any>;
}

class DataServicesAdapter {
    constructor(private readonly services: Services) {}

    public open(path: string): Promise<ConservifyFile> {
        return this.services.Conservify().open(path);
    }

    public listFolder(path: string): Promise<FileLike[]> {
        return this.services.FileSystem().listFolder(path);
    }
}

export type DataServices = () => DataServicesAdapter;

export function createDataServices(services: Services): DataServices {
    const dataServices = new DataServicesAdapter(services);
    return () => dataServices;
}
