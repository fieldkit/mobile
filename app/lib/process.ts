import _ from "lodash";
import { DataServices, Task, TaskQueuer } from "./tasks";
import { MergeMetaAndDataVisitor, ReadingsVisitor, Readings } from "./readings";
import { SaveReadingsTask } from "./database";
import { StationReader } from "./parsing";
import { DownloadsDirectory, getDeviceIdFromPath, listAllFiles } from "@/lib/fs";

class SaveReadingsVisitor implements ReadingsVisitor {
    private pending: Readings[] = [];
    private purge = true;

    constructor(private readonly deviceId: string, private readonly tasks: TaskQueuer) {}

    public onReadings(readings: Readings): void {
        this.pending.push(readings);
        if (this.pending.length == 1000) {
            this.flush();
        }
    }

    public onDone(): void {
        this.flush();
    }

    private flush() {
        this.tasks.enqueue(new SaveReadingsTask(this.deviceId, this.purge, this.pending));
        this.pending = [];
        this.purge = false;
    }
}

export class ProcessStationFilesTask extends Task {
    public readonly taskName = "ProcessStationFilesTask";

    constructor(public readonly deviceId: string) {
        super();
    }

    public run(services: DataServices, tasks: TaskQueuer): Promise<any> {
        const visitor = new MergeMetaAndDataVisitor(new SaveReadingsVisitor(this.deviceId, tasks));
        return new StationReader(services, this.deviceId)
            .walkData(visitor)
            .then((visitor) => {
                console.log("done");
            })
            .catch((error) => {
                console.log("error", error, error.stack);
            });
    }
}

export class ProcessAllStationsTask extends Task {
    public readonly taskName = "ProcessAllStationsTask";

    constructor() {
        super();
    }

    private getAllDeviceIds(): Promise<string[]> {
        return listAllFiles(DownloadsDirectory).then((files) => {
            return _.uniq(files.map((file) => getDeviceIdFromPath(file.path)));
        });
    }

    public async run(services: DataServices, tasks: TaskQueuer): Promise<any> {
        for (const deviceId of await this.getAllDeviceIds()) {
            console.log("deviceId", deviceId);
            tasks.enqueue(new ProcessStationFilesTask(deviceId));
        }
        return {};
    }
}
