import { MergeMetaAndDataVisitor, ReadingsVisitor, Readings } from "./readings";
import { DeviceReader } from "./parsing";
import { DataServices, Task, TaskQueue, TaskQueuer } from "./tasks";
import { DataQueryParams, ReadingsDatabase, SaveReadingsTask } from "./database";

import StandardWorker from "nativescript-worker-loader!./worker";

// whatever;

const queue = new TaskQueue();

export async function testWithFiles(deviceId: string) {
    if (true) {
        if (queue.size == 0) {
            queue.start(1, StandardWorker);
        }
        queue.enqueue(new ProcessDeviceFilesTask(deviceId));
    } else {
        const db = await ReadingsDatabase.forDevice(deviceId);
        const summary = await db.describe();
        const params = new DataQueryParams(
            summary.start,
            summary.end,
            summary.sensors.map((s) => s.id),
            0,
            100
        );
        console.log("summary", summary);
        const rows = await db.query(params);
        console.log("queried", rows.length);
    }
}

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

export class ProcessDeviceFilesTask extends Task {
    public readonly taskName = "ProcessDeviceFilesTask";

    constructor(public readonly deviceId: string) {
        super();
    }

    public run(services: DataServices, tasks: TaskQueuer): Promise<any> {
        const visitor = new MergeMetaAndDataVisitor(new SaveReadingsVisitor(this.deviceId, tasks));
        return new DeviceReader(services, this.deviceId)
            .walkData(visitor)
            .then((visitor) => {
                console.log("done");
            })
            .catch((error) => {
                console.log("error", error, error.stack);
            });
    }
}
