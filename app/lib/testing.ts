import { MergeMetaAndDataVisitor, ReadingsVisitor, Readings } from "./readings";
import { DeviceReader } from "./parsing";
import { DataServices, Task, TaskQueue, TaskQueuer } from "./tasks";
import { SaveReadingsTask } from "./database";

import ReadingsDatabaseWorker from "nativescript-worker-loader!./worker";

const queue = new TaskQueue();

export async function testWithFiles(deviceId: string) {
    if (queue.size == 0) {
        queue.start(1, ReadingsDatabaseWorker);
    }

    queue.enqueue(new ProcessDeviceFilesTask(deviceId));
}

class SaveReadingsVisitor implements ReadingsVisitor {
    private pending: Readings[] = [];

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
        if (this.pending.length > 0) {
            this.tasks.enqueue(new SaveReadingsTask(this.deviceId, this.pending));
            this.pending = [];
        }
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
