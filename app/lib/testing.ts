import { ProcessAllStationsTask } from "./process";
import Services from "@/services/singleton";

export async function testWithFiles(deviceId: string) {
    Services.Tasks().enqueue(new ProcessAllStationsTask());

    /*
    const db = await ReadingsDatabase.forDevice(deviceId);
    const summaries = await db.summarize();
    const rows = await db.query(summaries.makeDefaultParams());
    console.log("rows", rows);
	*/
}
