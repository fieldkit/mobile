import _ from "lodash";
import { debug } from "./debugging";
import { ParsedDataRecord, coerceNumber } from "./data-file";
import { DataVisitor } from "./data-reader";
import { Buffer } from "buffer";

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
        const sgs = data.parsed?.readings?.sensorGroups;
        if (!sgs) throw new Error(`no sensor groups`);
        const map = _.fromPairs(
            _.flatten(
                sgs.map((sg, moduleIndex) => {
                    const moduleMeta = meta.parsed.modules[moduleIndex];
                    if (!moduleMeta) throw new Error(`missing module meta: ${moduleIndex}`);
                    if (!sg.readings) throw new Error(`missing readings: ${JSON.stringify(sg)}`);
                    return sg.readings.map((s, sensorIndex) => {
                        if (!moduleMeta.sensors) throw new Error(`missing sensors in module meta: ${JSON.stringify(moduleMeta)}`);
                        const sensorMeta = moduleMeta.sensors[sensorIndex];
                        const key = [moduleMeta.name, sensorMeta.name].join(".");
                        return [key, s.value];
                    });
                })
            )
        );

        const deviceId = meta.parsed?.metadata?.deviceId;
        const generation = meta.parsed?.metadata?.generation;
        const time = data.parsed?.readings?.time;
        const uptime = data.parsed?.readings?.uptime;

        if (!time) throw new Error(`data-record: missing time`);
        if (!uptime) throw new Error(`data-record: missing uptime`);
        if (!deviceId) throw new Error(`data-record: missing deviceId`);
        if (!generation) throw new Error(`data-record: missing generation`);

        const deviceIdHex = Buffer.from(deviceId).toString("hex");
        const generationHex = Buffer.from(generation).toString("hex");

        const readings = new Readings(coerceNumber(time), uptime, data.record, meta.record, deviceIdHex, generationHex, map);

        try {
            this.visitor.onReadings(readings);
        } catch (e) {
            debug.log("visitor:error: ${e.message}");
            throw e;
        }
    }

    public onDone(): void {
        try {
            this.visitor.onDone();
        } catch (e) {
            debug.log("visitor:error: ${e.message}");
            throw e;
        }
    }
}
