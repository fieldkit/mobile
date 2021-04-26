/* eslint @typescript-eslint/no-non-null-assertion: "off" */
import { fk_app as AppProto } from "fk-app-protocol/fk-app";
import { fk_atlas as AtlasProto } from "fk-atlas-protocol/fk-atlas";
import { fk_data as DataProto } from "fk-data-protocol/fk-data";
import Long from "long";

const HttpReply = AppProto.HttpReply;

export interface CurrentUser {
    portalId: number;
    name: string;
    email: string;
    usedAt: Date | null;
    token: string | null;
    transmission: {
        token: string;
        url: string;
    } | null;
    lastSync: Date | null;
}

export interface LiveSensorReading {
    sensor: SensorCapabilities;
    value: number;
    uncalibrated: number;
}

export interface LiveModuleReadings {
    module: ModuleStatusReply;
    readings: LiveSensorReading[];
}

export interface LiveReadings {
    time: number;
    modules: LiveModuleReadings[];
}

export interface AtlasStatus {
    type: AtlasProto.SensorType;
    calibration: {
        total: number;
    };
}

type ModuleConfiguration = DataProto.ModuleConfiguration;

export { ModuleConfiguration };

export interface ModuleCapabilities {
    name: string;
    deviceId: string;
    position: number;
    flags: number;
    status: ModuleConfiguration;
    sensors: SensorCapabilities[];
}

export interface SensorCapabilities {
    name: string;
    unitOfMeasure: string;
    number: number;
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
    moduleId: string;
    position: number;
    name: string;
    flags: number;
    sensors: AppProto.SensorCapabilities[];
    configuration: ModuleConfiguration | null;
}

export interface HttpStatusReply {
    type: AppProto.ReplyType;
    status: ReplyStatus;
    modules: ModuleStatusReply[];
    liveReadings: LiveReadings[];
    schedules: ReplySchedules;
    streams: ReplyStream[];
    networkSettings: NetworkSettings;
    errors: AppProto.IError[];
    serialized: string;
    logs: string | null;
}

export type SerializedStatus = string;

export function decodeAndPrepare(reply: Buffer, serialized: SerializedStatus): HttpStatusReply {
    return prepareReply(HttpReply.decodeDelimited(reply), serialized);
}

export const EmptyModuleConfig: ModuleConfiguration = new DataProto.ModuleConfiguration();

export function fixupModuleConfiguration(buffer: Buffer | null): ModuleConfiguration | null {
    if (!buffer || buffer.length == 0) {
        return null;
    }
    try {
        return DataProto.ModuleConfiguration.decodeDelimited(buffer);
    } catch (error) {
        console.log(`invalid-module-configuration: ${buffer.toString("hex")}`);
        return null;
    }
}

function toHexString(value: Uint8Array): string {
    return Buffer.from(value).toString("hex");
}

function translateModule(m: AppProto.IModuleCapabilities | null, moduleConfigurations: ModuleConfigurations): ModuleStatusReply {
    if (!m) throw new Error(`malformed reply: null module`);
    if (!m.name) throw new Error(`malformed reply: no module name`);
    if (!m.sensors) throw new Error(`malformed reply: no module name`);
    if (!m.id) throw new Error(`malformed reply: no module id`);

    const moduleId = toHexString(m.id);
    const fromReply = fixupModuleConfiguration(m.configuration ? Buffer.from(m.configuration) : null);
    const config = fromReply || moduleConfigurations[moduleId];
    if (fromReply) {
        moduleConfigurations[moduleId] = fromReply;
    }

    return {
        moduleId: moduleId,
        configuration: config || EmptyModuleConfig,
        sensors: m.sensors.map((s) => new AppProto.SensorCapabilities(s)),
        name: m.name,
        position: m.position!,
        flags: m.flags!,
    };
}

type ModuleConfigurations = { [index: string]: ModuleConfiguration };

function translateLiveModuleReadings(lmr: AppProto.ILiveModuleReadings, moduleConfigurations: ModuleConfigurations): LiveModuleReadings {
    return {
        module: translateModule(lmr.module || null, moduleConfigurations),
        readings: lmr.readings!.map((lsr) => {
            return {
                sensor: new AppProto.SensorCapabilities(lsr.sensor),
                value: lsr.value!,
                uncalibrated: lsr.uncalibrated!,
            };
        }),
    };
}

function translateLiveReadings(lr: AppProto.ILiveReadings, moduleConfigurations: ModuleConfigurations): LiveReadings {
    return {
        time: translateLong(lr.time),
        modules: lr.modules!.map((lmr) => translateLiveModuleReadings(lmr, moduleConfigurations)),
    };
}

function translateSchedule(schedule: AppProto.ISchedule | undefined): ReplySchedule {
    if (!schedule || !schedule.intervals) {
        return {
            intervals: [],
        };
    }
    return {
        intervals: schedule.intervals.map(
            (i: AppProto.IInterval): ReplyScheduleInterval => {
                return {
                    start: translateLong(i.start),
                    end: translateLong(i.end),
                    interval: translateLong(i.interval),
                };
            }
        ),
    };
}

function translateRecordingLocation(
    location: AppProto.ILocation | undefined
): { latitude: number; longitude: number; time: number } | null {
    if (!location || !location.latitude || !location.longitude || !location.time) {
        return null;
    }
    return {
        latitude: location.latitude,
        longitude: location.longitude,
        time: translateLong(location.time),
    };
}

function translateConnectedNetwork(network: AppProto.INetworkInfo | undefined): NetworkInfo | null {
    if (!network) {
        return null;
    }
    /*
    if (!network.ssid) {
        console.log(`translateConnectedNetwork: ssid is required ignoring network`);
        return null;
    }
    if (!network.password) {
        console.log(`translateConnectedNetwork: password is required`);
    }
	*/
    return {
        ssid: network.ssid ?? "",
        // password: "", // PRIVACY
        password: network.password ?? "",
    };
}

export interface HttpStatusErrorReply {
    errors: unknown;
}

function translateLong(value: number | Long | undefined): number {
    return value as number;
}

export function prepareReply(reply: AppProto.HttpReply, serialized: SerializedStatus | null): HttpStatusReply /* | HttpStatusErrorReply */ {
    if (!serialized) {
        console.log(`no serialized`);
        throw new Error(`no serialized`);
    }

    if (reply.errors && reply.errors.length > 0) {
        console.log(`reply error: ${JSON.stringify(reply.errors)}`);
        throw new Error(`reply error: ${JSON.stringify(reply.errors)}`);
    }

    if (!reply.status) throw new Error(`reply.status`);
    if (!reply.status.identity) throw new Error(`reply.status.identity`);
    if (!reply.status.gps) throw new Error(`reply.status.gps`);
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

    const moduleConfigurations: { [index: string]: ModuleConfiguration } = {};

    const prepared = {
        type: reply.type,
        status: {
            identity: {
                name: reply.status.identity.device!,
                stream: reply.status.identity.stream!,
                firmware: reply.status.identity.firmware!,
                build: reply.status.identity.build!,
                number: reply.status.identity.number!,
                deviceId: Buffer.from(reply.status.identity.deviceId!).toString("hex"),
                generationId: Buffer.from(reply.status.identity.generationId!).toString("hex"),
            },
            gps: {
                enabled: reply.status.gps.enabled!,
                fix: reply.status.gps.fix!,
                time: translateLong(reply.status.gps.time),
                satellites: reply.status.gps.satellites!,
                longitude: reply.status.gps.longitude!,
                latitude: reply.status.gps.latitude!,
                altitude: reply.status.gps.altitude!,
            },
            recording: {
                enabled: reply.status.recording.enabled!,
                startedTime: translateLong(reply.status.recording.startedTime),
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
                timestamp: translateLong(reply.status.firmware.timestamp),
                hash: reply.status.firmware.hash!,
            },
        },
        schedules: {
            readings: translateSchedule(reply.schedules.readings),
            network: translateSchedule(reply.schedules.network),
        },
        modules: reply.modules.map((m: AppProto.IModuleCapabilities) => translateModule(m, moduleConfigurations)),
        liveReadings: reply.liveReadings.map((lr: AppProto.ILiveReadings) => translateLiveReadings(lr, moduleConfigurations)),
        streams: reply.streams.map(
            (s: AppProto.IDataStream): ReplyStream => {
                return {
                    time: translateLong(s.time),
                    block: translateLong(s.block),
                    size: translateLong(s.size),
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
        logs: reply.status.logs || null,
        serialized: serialized,
    };

    // console.log(`prepare-reply`, prepared);

    return prepared;
}

/*
function numberOfOnes(n: number): number {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}
*/
