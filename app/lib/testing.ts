import Services from "@/services/services";

import { createDataServices } from "./data-services";
import { MergeMetaAndDataVisitor, ReadingsVisitor, Readings } from "./readings";
import { DeviceReader } from "./parsing";

import ReadingsDatabaseWorker from "nativescript-worker-loader!./worker";

export async function testWithFiles(services: Services, deviceId: string) {
    const worker = new ReadingsDatabaseWorker();
    worker.postMessage({ message: "hello" });
    worker.onmessage = (message) => {
        console.log(`main:received: ${JSON.stringify(message)}`);
    };

    const dataServices = createDataServices(services);
    const IgnoringVisitor = class implements ReadingsVisitor {
        private pending: Readings[] = [];

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
                worker.postMessage({ readings: this.pending });
                this.pending = [];
            }
        }
    };

    const visitor = new MergeMetaAndDataVisitor(new IgnoringVisitor());
    return new DeviceReader(dataServices, deviceId)
        .walkData(visitor)
        .then((visitor) => {
            console.log("done");
        })
        .catch((error) => {
            console.log("error", error, error.stack);
        });
}

// whatever;
