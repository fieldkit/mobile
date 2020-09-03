import _ from "lodash";
import { TaskWorker } from "./tasks";
import { SaveReadingsTask } from "./database";
import { ProcessDeviceFilesTask } from "./testing";
import { createAdaptedDataServices } from "./data-services";
import Services from "@/services/services";

/**
 * NativeScript requires this to wire up the JS context in this thread.
 */
require("globals");

try {
    console.log(`worker:starting`);

    const context: Worker = self as any;
    const services = createAdaptedDataServices(Services);
    const taskWorker = new TaskWorker(context, services, {
        ProcessDeviceFilesTask,
        SaveReadingsTask,
    });

    context.onmessage = (message) => {
        taskWorker.message(message);
    };

    context.onerror = (error) => {
        return taskWorker.error(error);
    };

    console.log(`worker:started`);
} catch (error) {
    console.log(`worker:error: ${error}`);
}
