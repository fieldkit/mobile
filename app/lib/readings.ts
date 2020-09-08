import _ from "lodash";
import { ParsedDataRecord } from "./data-file";
import { DataVisitor } from "./data-reader";

export type ReadingsMap = { [index: string]: number };

export class Readings {
    constructor(
        public readonly time: number,
        public readonly uptime: number,
        public readonly record: number,
        public readonly meta: number,
        public readonly deviceId: string,
        public readonly generation: string,
        public readonly readings: ReadingsMap
    ) {}
}

export interface ReadingsVisitor {
    onReadings(readings: Readings): void;
    onDone(): void;
}

export class MergeMetaAndDataVisitor implements DataVisitor {
    constructor(private readonly visitor: ReadingsVisitor) {}

    public onData(data: ParsedDataRecord, meta: ParsedDataRecord): void {
        const map = _.fromPairs(
            _.flatten(
                data.parsed.readings.sensorGroups.map((sg, moduleIndex) => {
                    const moduleMeta = meta.parsed.modules[moduleIndex];
                    return sg.readings.map((s, sensorIndex) => {
                        const sensorMeta = moduleMeta.sensors[sensorIndex];
                        const key = [moduleMeta.name, sensorMeta.name].join(".");
                        return [key, s.value];
                    });
                })
            )
        );

        const deviceId = Buffer.from(meta.parsed.metadata.deviceId).toString("hex");
        const generation = Buffer.from(meta.parsed.metadata.generation).toString("hex");

        const readings = new Readings(
            data.parsed.readings.time,
            data.parsed.readings.uptime,
            data.record,
            meta.record,
            deviceId,
            generation,
            map
        );

        try {
            this.visitor.onReadings(readings);
        } catch (e) {
            console.log("visitor:error: ${e.message}");
            throw e;
        }
    }

    public onDone(): void {
        try {
            this.visitor.onDone();
        } catch (e) {
            console.log("visitor:error: ${e.message}");
            throw e;
        }
    }
}
