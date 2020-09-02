import _ from "lodash";
import { Readings } from "./readings";
import { ReadingsDatabase } from "./database";

/**
 * NativeScript requires this to wire up the JS context in this thread.
 */
require("globals");

// whatever;

const context: Worker = self as any;

export interface WorkerMessage {
    data: { readings?: Readings[] };
}

export interface WorkerError {
    message: any;
    filename: any;
    lineno: any;
}

const name = ":memory:"; // "cache/fkdata.sqlite3"
const readingsDbPromise = ReadingsDatabase.open(name);

function saveReadings(readings: Readings[]): Promise<any> {
    console.log(`worker:received: <readings>`);
    return readingsDbPromise
        .then((readingsDb) => {
            const sensorKeys = _.uniq(_.flatten(readings.map((r) => Object.keys(r.readings))));
            return Promise.all(sensorKeys.map((key) => readingsDb.findSensor(key))).then((sensors) => {
                console.log(`worker:processed: <readings>`);
            });
        })
        .catch((error) => {
            console.log(`error: ${error}`);
        });
}

context.onmessage = (message: WorkerMessage) => {
    if (message.data.readings) {
        saveReadings(message.data.readings);
    } else {
        console.log(`worker:received: ${JSON.stringify(message)}`);
        // context.postMessage({ done: true });
    }
};

context.onerror = (e: WorkerError): boolean => {
    console.log(`worker:error ${e}`);
    return true;
};

console.log("worker:started");
