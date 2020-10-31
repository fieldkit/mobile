import deepmerge from "deepmerge";
import { fk_app } from "fk-app-protocol/fk-app";
import { fk_atlas } from "fk-atlas-protocol/fk-atlas";

const HttpReply = fk_app.HttpReply;
const AtlasReply = fk_atlas.WireAtlasReply;
const SensorType = fk_atlas.SensorType;

export interface LiveSensorReading {
    sensor: SensorCapabilities;
    value: number;
}

export interface LiveModuleReadings {
    module: ModuleCapabilities;
    readings: LiveSensorReading[];
}

export interface LiveReadings {
    time: number;
    modules: LiveModuleReadings[];
}

export interface AtlasStatus {
    calibration: {
        total: number;
    };
}

export interface ModuleCapabilities {
    name: string;
    deviceId: string;
    position: number;
    flags: number;
    status: AtlasStatus | null;
    sensors: SensorCapabilities[];
}

export interface SensorCapabilities {
    name: string;
    unitOfMeasure: string;
}

export interface ReplySchedule {
    intervals: {
        start: number;
        end: number;
        interval: number;
    }[];
}

export interface ReplySchedules {
    readings: ReplySchedule;
    network: ReplySchedule;
}

export interface ReplyStatus {
    identity: {
        device: string;
        stream: string;
        deviceId: string;
        firmware: string;
        build: string;
        number: string;
        generation: string;
        generationId: string;
        name: string;
    };
    gps: {
        enabled: number;
        fix: number;
        time: number;
        satellites: number;
        longitude: number;
        latitude: number;
        altitude: number;
    };
    recording: {
        enabled: number;
        startedTime: number;
        location: {
            longitude: number;
            latitude: number;
            time: number;
        };
    };
    memory: {
        sramAvailable: number;
        programFlashAvailable: number;
        extendedMemoryAvailable: number;
        dataMemoryInstalled: number;
        dataMemoryUsed: number;
        dataMemoryConsumption: number;
    };
    power: {
        battery: {
            voltage: number;
            percentage: number;
        };
        solar: {
            voltage: number;
        };
    };
    schedules: ReplySchedules;
    firmware: {
        version: string;
        build: string;
        number: string;
        timestamp: number;
        hash: string;
    };
}

export interface ReplyStream {
    time: number;
    block: number;
    size: number;
    path: string;
    name: string;
}

export interface NetworkInfo {
    ssid: string;
    password: string;
    create?: boolean;
    preferred?: boolean;
}

export interface NetworkSettings {
    createAccessPoint: number;
    connected: NetworkInfo;
    macAddress: string;
    networks: NetworkInfo[];
}

export interface ModuleStatusReply {
    position: number;
    name: string;
    deviceId: string;
    flags: number;
    sensors: fk_app.SensorCapabilities[];
    status: AtlasStatus | null;
}

export interface HttpStatusReply {
    type: fk_app.ReplyType;
    status: ReplyStatus;
    modules: ModuleStatusReply[];
    liveReadings: LiveReadings[];
    schedules: ReplySchedules;
    streams: ReplyStream[];
    networkSettings: NetworkSettings;
    serialized: string;
    errors: any[];
}

export function decodeAndPrepare(reply): HttpStatusReply {
    return prepareReply(HttpReply.decodeDelimited(reply));
}

export function fixupCalibrationStatus(reply: fk_atlas.WireAtlasReply): AtlasStatus | null {
    if (!reply.calibration) {
        throw new Error("reply has no calibration");
    }

    let total: number | null = null;
    switch (reply.calibration.type) {
        case SensorType.SENSOR_PH:
            total = numberOfOnes(reply.calibration.ph || 0);
            break;
        case SensorType.SENSOR_TEMP:
            total = numberOfOnes(reply.calibration.temp || 0);
            break;
        case SensorType.SENSOR_ORP:
            total = numberOfOnes(reply.calibration.orp || 0);
            break;
        case SensorType.SENSOR_DO:
            total = numberOfOnes(reply.calibration.dissolvedOxygen || 0);
            break;
        case SensorType.SENSOR_EC:
            total = numberOfOnes(reply.calibration.ec || 0);
            break;
        case SensorType.SENSOR_NONE:
            break;
        default:
            console.warn("unexpected calibration type");
            break;
    }

    if (!total) {
        return null;
    }

    return {
        calibration: {
            total: total,
        },
    };
}

function prepareModule(m: fk_app.ModuleCapabilities): ModuleStatusReply {
    const maybeDecodeStatus = () => {
        if (m.status && m.status.length > 0) {
            if (m.name.indexOf("modules.water.") == 0) {
                return fixupCalibrationStatus(AtlasReply.decode(Buffer.from(m.status)));
            } else {
                console.log("unknown module status", m);
            }
        }
        return null;
    };
    return {
        deviceId: Buffer.from(m.id).toString("hex"),
        status: maybeDecodeStatus(),
        sensors: m.sensors.map((s) => new fk_app.SensorCapabilities(s)),
        name: m.name,
        position: m.position,
        flags: m.flags,
    };
}

const MandatoryStatus = {
    status: {
        identity: {},
        power: {
            battery: {
                percentage: 0.0,
            },
        },
        memory: {
            dataMemoryConsumption: 0,
        },
        recording: {
            enabled: false,
        },
        gps: {
            latitude: 0,
            longitude: 0,
        },
    },
};

export function prepareReply(reply: any /* fk_app.HttpReply */): HttpStatusReply {
    if (reply.errors && reply.errors.length > 0) {
        return reply;
    }

    // NOTE deepmerge ruins deviceId.
    if (reply.status && reply.status.identity) {
        reply.status.identity.deviceId = Buffer.from(reply.status.identity.deviceId).toString("hex");
        reply.status.identity.generationId = Buffer.from(reply.status.identity.generation).toString("hex");
        reply.status.identity.generation = null;
    }
    if (reply.modules && Array.isArray(reply.modules)) {
        reply.modules = reply.modules.map((m) => prepareModule(m));
    }
    if (reply.liveReadings && Array.isArray(reply.liveReadings)) {
        reply.liveReadings.map((lr) => {
            lr.modules
                .filter((m) => m.module && m.module.id)
                .map((m) => {
                    return prepareModule(m.module);
                });
        });
    }
    if (reply.streams && reply.streams.length > 0) {
        reply.streams.forEach((s) => {
            s.block = s.block ? s.block : 0;
            s.size = s.size ? s.size : 0;
        });
    }

    const fixupSchedule = (schedule) => {
        if (schedule && schedule.intervals) {
            schedule.intervals.forEach((i) => {
                i.start = i.start || 0;
                i.end = i.end || 0;
                i.interval = i.interval || 0;
            });
        }
    };

    if (reply.status?.schedules) {
        fixupSchedule(reply.status.schedules.readings);
        fixupSchedule(reply.status.schedules.network);
        fixupSchedule(reply.status.schedules.gps);
        fixupSchedule(reply.status.schedules.lora);
    }

    if (reply.schedules) {
        fixupSchedule(reply.schedules.readings);
        fixupSchedule(reply.schedules.network);
        fixupSchedule(reply.schedules.gps);
        fixupSchedule(reply.schedules.lora);
    }

    return deepmerge.all([MandatoryStatus, reply]) as HttpStatusReply;
}

function numberOfOnes(n: number): number {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}
