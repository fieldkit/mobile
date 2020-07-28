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
    interval: number;
}

export interface ReplySchedules {
    readings: ReplySchedule;
}

export interface ReplyStatus {
    identity: any;
    gps: any;
    recording: any;
    memory: any;
    power: any;
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
}
