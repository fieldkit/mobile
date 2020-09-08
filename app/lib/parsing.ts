import _ from "lodash";
import { DataServices } from "./data-services";
import { DataVisitor, DataReader } from "./data-reader";

export class StationReader {
    constructor(private readonly services: DataServices, private readonly deviceId: string) {}

    public walkData<T extends DataVisitor>(visitor: T): Promise<T> {
        return this.services()
            .listFolder(["downloads", this.deviceId].join("/"))
            .then((files) => {
                const paths = files.map((f) => f.path);
                return new DataReader(this.services, paths).walkData(visitor);
            })
            .then(() => {
                visitor.onDone();
            })
            .then(() => visitor);
    }
}
