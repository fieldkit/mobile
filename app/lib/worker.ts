import _ from "lodash";
import { TaskWorker } from "./tasks";
import { SaveReadingsTask } from "./database";

/**
 * NativeScript requires this to wire up the JS context in this thread.
 */
require("globals");

console.log("worker:started");

const context: Worker = self as any;

const taskWorker = new TaskWorker(context, {
    SaveReadingsTask,
});

context.onmessage = (message) => {
    taskWorker.message(message);
};

context.onerror = (error) => {
    return taskWorker.error(error);
};
