import { TaskQueue } from "./tasks";
import { ProcessAllStationsTask } from "./process";

import StandardWorker from "nativescript-worker-loader!./worker";

const queue = new TaskQueue();

export async function testWithFiles(deviceId: string) {
    if (queue.size == 0) {
        queue.start(1, StandardWorker);
    }
    queue.enqueue(new ProcessAllStationsTask());

    /*
    const db = await ReadingsDatabase.forDevice(deviceId);
    const summaries = await db.summarize();
    const rows = await db.query(summaries.makeDefaultParams());
    console.log("rows", rows);
	*/
}
