// import deepmerge from "deepmerge";
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

export type CalibrationStatus = AtlasStatus | null;

export interface ModuleCapabilities {
    name: string;
    deviceId: string;
    position: number;
    flags: number;
    status: CalibrationStatus;
    sensors: SensorCapabilities[];
}

export interface SensorCapabilities {
    name: string;
    unitOfMeasure: string;
}

export interface ReplyScheduleInterval {
    start: number;
    end: number;
    interval: number;
}

export interface ReplySchedule {
    intervals: ReplyScheduleInterval[];
}

export interface ReplySchedules {
    readings: ReplySchedule;
    network: ReplySchedule;
}

export interface LocationLike {
    longitude: number;
    latitude: number;
    time: number;
}

export interface ReplyStatus {
    identity: {
        stream: string;
        deviceId: string;
        firmware: string;
        build: string;
        number: string;
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
        enabled: boolean;
        startedTime: number;
        location: LocationLike | null;
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
    connected: NetworkInfo | null;
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
    errors: fk_app.IError[];
    serialized: string;
}

export type SerializedStatus = string;

export function decodeAndPrepare(reply: any, serialized: SerializedStatus): HttpStatusReply {
    return prepareReply(HttpReply.decodeDelimited(reply), serialized);
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

function toHexString(value: Uint8Array): string {
    return (value as any).toString("hex") as string;
}

function translateModule(m: fk_app.IModuleCapabilities | undefined): ModuleStatusReply {
    if (!m) throw new Error(`malformed reply: null module`);
    if (!m.name) throw new Error(`malformed reply: no module name`);
    if (!m.sensors) throw new Error(`malformed reply: no module name`);

    const maybeDecodeStatus = (m: fk_app.IModuleCapabilities): CalibrationStatus => {
        if (m.name && m.status && m.status.length > 0) {
            if (m.name.indexOf("modules.water.") == 0) {
                return fixupCalibrationStatus(AtlasReply.decode(Buffer.from(m.status)));
            } else {
                console.log("unknown module status", m);
            }
        }
        return null;
    };
    return {
        deviceId: toHexString(m.id!),
        status: maybeDecodeStatus(m),
        sensors: m.sensors.map((s) => new fk_app.SensorCapabilities(s)),
        name: m.name,
        position: m.position!,
        flags: m.flags!,
    };
}

function translateLiveModuleReadings(lmr: fk_app.ILiveModuleReadings): LiveModuleReadings {
    return {
        module: translateModule(lmr.module),
        readings: lmr.readings!.map((lsr) => {
            return {
                sensor: new fk_app.SensorCapabilities(lsr.sensor),
                value: lsr.value!,
            };
        }),
    };
}

function translateLiveReadings(lr: fk_app.ILiveReadings): LiveReadings {
    return {
        time: lr.time,
        modules: lr.modules!.map((lmr) => translateLiveModuleReadings(lmr)),
    };
}

function translateSchedule(schedule: fk_app.ISchedule | undefined): ReplySchedule {
    if (!schedule || !schedule.intervals) {
        return {
            intervals: [],
        };
    }
    return {
        intervals: schedule.intervals.map(
            (i: fk_app.IInterval): ReplyScheduleInterval => {
                return {
                    start: i.start || 0,
                    end: i.end || 0,
                    interval: i.interval || 0,
                };
            }
        ),
    };
}

function translateRecordingLocation(location: fk_app.ILocation | undefined): { latitude: number; longitude: number; time: number } | null {
    if (!location || !location.latitude || !location.longitude || !location.time) {
        return null;
    }
    return {
        latitude: location.latitude,
        longitude: location.longitude,
        time: location.time,
    };
}

function translateConnectedNetwork(network: fk_app.INetworkInfo | undefined): NetworkInfo | null {
    if (!network) {
        return null;
    }
    return {
        ssid: network.ssid!,
        password: "", // PRIVACY
    };
}

export interface HttpStatusErrorReply {
    errors: unknown;
}

export function prepareReply(reply: fk_app.HttpReply, serialized: SerializedStatus | null): HttpStatusReply /* | HttpStatusErrorReply */ {
    if (!serialized) {
        console.log(`no serialized`);
        throw new Error(`no serialized`);
    }

    if (reply.errors && reply.errors.length > 0) {
        console.log(`reply error: ${JSON.stringify(reply.errors)}`);
        throw new Error(`reply error: ${JSON.stringify(reply.errors)}`);
    }

    console.log(`reply-check`);

    if (!reply.status) throw new Error(`reply.status`);
    if (!reply.status.identity) throw new Error(`reply.status.identity`);
    if (!reply.status.gps) throw new Error(`reply.statusgps`);
    if (!reply.status.recording) throw new Error(`reply.status.recording`);
    if (!reply.status.memory) throw new Error(`reply.status.memory`);
    if (!reply.status.power) throw new Error(`reply.status.power`);
    if (!reply.status.power.battery) throw new Error(`reply.status.power.battery`);
    if (!reply.status.power.solar) throw new Error(`reply.status.power.solar`);
    if (!reply.status.firmware) throw new Error(`reply.status.firmware`);
    if (!reply.networkSettings) {
        reply.networkSettings = {
            networks: [],
        };
    }
    if (!reply.schedules) {
        reply.schedules = {
            readings: { intervals: [] },
            network: { intervals: [] },
        };
    }

    console.log(`reply-build`);

    return {
        type: reply.type,
        status: {
            identity: {
                name: reply.status.identity.device!,
                stream: reply.status.identity.stream!,
                firmware: reply.status.identity.firmware!,
                build: reply.status.identity.build!,
                number: reply.status.identity.number!,
                deviceId: Buffer.from(reply.status.identity.deviceId!).toString("hex"),
                generationId: Buffer.from(reply.status.identity.generation!).toString("hex"),
            },
            gps: {
                enabled: reply.status.gps.enabled!,
                fix: reply.status.gps.fix!,
                time: reply.status.gps.time,
                satellites: reply.status.gps.satellites!,
                longitude: reply.status.gps.longitude!,
                latitude: reply.status.gps.latitude!,
                altitude: reply.status.gps.altitude!,
            },
            recording: {
                enabled: reply.status.recording.enabled!,
                startedTime: reply.status.recording.startedTime,
                location: translateRecordingLocation(reply.status.recording.location),
            },
            memory: {
                sramAvailable: reply.status.memory.sramAvailable!,
                programFlashAvailable: reply.status.memory.programFlashAvailable!,
                extendedMemoryAvailable: reply.status.memory.extendedMemoryAvailable!,
                dataMemoryInstalled: reply.status.memory.dataMemoryInstalled!,
                dataMemoryUsed: reply.status.memory.dataMemoryUsed!,
                dataMemoryConsumption: reply.status.memory.dataMemoryConsumption!,
            },
            power: {
                battery: {
                    voltage: reply.status.power.battery.voltage!,
                    percentage: reply.status.power.battery.percentage!,
                },
                solar: {
                    voltage: reply.status.power.solar.voltage!,
                },
            },
            schedules: {
                // DEPRECATE
                readings: translateSchedule(reply.schedules.readings),
                network: translateSchedule(reply.schedules.network),
            },
            firmware: {
                version: reply.status.firmware.version!,
                build: reply.status.firmware.build!,
                number: reply.status.firmware.number!,
                timestamp: reply.status.firmware.timestamp,
                hash: reply.status.firmware.hash!,
            },
        },
        schedules: {
            readings: translateSchedule(reply.schedules.readings),
            network: translateSchedule(reply.schedules.network),
        },
        modules: reply.modules.map((m: fk_app.IModuleCapabilities) => translateModule(m)),
        liveReadings: reply.liveReadings.map((lr: fk_app.ILiveReadings) => translateLiveReadings(lr)),
        streams: reply.streams.map(
            (s: fk_app.IDataStream): ReplyStream => {
                return {
                    time: s.time,
                    block: s.block || 0,
                    size: s.size || 0,
                    path: s.path!,
                    name: s.name!,
                };
            }
        ),
        networkSettings: {
            createAccessPoint: reply.networkSettings.createAccessPoint!,
            macAddress: reply.networkSettings.macAddress!,
            connected: translateConnectedNetwork(reply.networkSettings.connected),
            networks: reply.networkSettings.networks!.map((n) => {
                return {
                    ssid: n.ssid!,
                    password: "", // PRIVACY
                };
            }),
        },
        errors: reply.errors,
        serialized: serialized,
    };
}

function numberOfOnes(n: number): number {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}
