// import { ProcessAllStationsTask } from "./process";
// import Services from "@/services/singleton";

export function testWithFiles(_deviceId: string): Promise<void> {
    // Services.Tasks().enqueue(new ProcessAllStationsTask());

    /*
    const db = await ReadingsDatabase.forDevice(deviceId);
    const summaries = await db.summarize();
    const rows = await db.query(summaries.makeDefaultParams());
    console.log("rows", rows);
	*/

    return Promise.resolve();
}
