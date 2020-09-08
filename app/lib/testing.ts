import { TaskQueue } from "./tasks";
import { ReadingsDatabase } from "./database";
import { ProcessStationFilesTask } from "./process";

import StandardWorker from "nativescript-worker-loader!./worker";

const queue = new TaskQueue();

export async function testWithFiles(deviceId: string) {
    if (true) {
        if (queue.size == 0) {
            queue.start(1, StandardWorker);
        }
        queue.enqueue(new ProcessStationFilesTask(deviceId));
    }

    const db = await ReadingsDatabase.forDevice(deviceId);
    const summaries = await db.summarize();
    const rows = await db.query(summaries.makeDefaultParams());
    console.log("rows", rows);
}
