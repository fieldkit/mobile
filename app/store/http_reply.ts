import deepmerge from "deepmerge";
import { fk_app } from "fk-app-protocol/fk-app";
import { fk_atlas } from "fk-atlas-protocol/fk-atlas";

const HttpReply = fk_app.HttpReply;
const AtlasReply = fk_atlas.WireAtlasReply;
const SensorType = fk_atlas.SensorType;
const DoCalibrations = fk_atlas.DoCalibrations;
const PhCalibrations = fk_atlas.PhCalibrations;
const EcCalibrations = fk_atlas.EcCalibrations;

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
    type: string;
    calibration: { type: string; ph: any; dissolvedOxygen: any; ec: any; orp: any; raw: number; total: number };
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
    intervals: { start: number; end: number; interval; number }[];
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
        satellites;
        number;
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

export interface HttpStatusReply {
    status: ReplyStatus;
    modules: ModuleCapabilities[];
    liveReadings: LiveReadings[];
    schedules: ReplySchedules;
    streams: ReplyStream[];
    serialized: string;
    errors: any[];
}

export function decodeAndPrepare(reply) {
    return prepareReply(HttpReply.decodeDelimited(reply));
}

function numberOfOnes(n: number): number {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}

export function fixupCalibrationStatus(reply) {
    switch (reply.calibration.type) {
        case SensorType.SENSOR_PH:
            reply.calibration.total = numberOfOnes(reply.calibration.ph);
            reply.calibration.phStatus = {
                low: reply.calibration.ph & PhCalibrations.PH_LOW,
                middle: reply.calibration.ph & PhCalibrations.PH_MIDDLE,
                high: reply.calibration.ph & PhCalibrations.PH_HIGH,
            };
            break;
        case SensorType.SENSOR_TEMP:
            reply.calibration.total = numberOfOnes(reply.calibration.temp);
            reply.calibration.tempStatus = {};
            break;
        case SensorType.SENSOR_ORP:
            reply.calibration.total = numberOfOnes(reply.calibration.orp);
            reply.calibration.orpStatus = {};
            break;
        case SensorType.SENSOR_DO:
            reply.calibration.total = numberOfOnes(reply.calibration.dissolvedOxygen);
            reply.calibration.doStatus = {
                atm: reply.calibration.dissolvedOxygen & DoCalibrations.DO_ATMOSPHERE,
                zero: reply.calibration.dissolvedOxygen & DoCalibrations.DO_ZERO,
            };
            break;
        case SensorType.SENSOR_EC:
            reply.calibration.total = numberOfOnes(reply.calibration.ec);
            reply.calibration.ecStatus = {
                dry: reply.calibration.ec & EcCalibrations.EC_DRY,
                single: reply.calibration.ec & EcCalibrations.EC_SINGLE,
                low: reply.calibration.ec & EcCalibrations.EC_DUAL_LOW,
                high: reply.calibration.ec & EcCalibrations.EC_DUAL_HIGH,
            };
            break;
        case SensorType.SENSOR_NONE:
            break;
        default:
            console.warn("unexpected calibration type");
            break;
    }

    return reply;
}

function prepareModule(m: any): any {
    m.deviceId = Buffer.from(m.id).toString("hex");
    m.id = null;
    if (m.status && /*_.isArray(m.status) &&*/ m.status.length > 0) {
        if (m.name.indexOf("modules.water.") == 0) {
            const buffer = Buffer.from(m.status);
            m.status = fixupCalibrationStatus(AtlasReply.decode(buffer));
        } else {
            console.log("unknown module status", m);
        }
    }
    return m;
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

export function prepareReply(reply): HttpStatusReply {
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
        reply.modules.map((m) => {
            return prepareModule(m);
        });
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
