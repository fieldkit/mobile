export interface StationTableRow {
    id: number;
    deviceId: string;
    generationId: string;
    name: string;
    batteryLevel: number | null;
    consumedMemory: number | null;
    totalMemory: number | null;
    schedules: string;
    longitude: number | null;
    latitude: number | null;
    deployStartTime: string | null;
    serializedStatus: string;
    lastSeen: number;
    portalId: number | null;
    portalHttpError: string | null;
}

export interface StationAddressRow {
    id: number;
    stationId: number;
    url: string;
}

export interface ModuleTableRow {
    id: number;
    name: string;
    position: number;
    moduleId: string;
    stationId: number | null;
    flags: number;
    status: string | null;
}

export interface StreamTableRow {
    id: number;
    stationId: number;
    deviceId: string;
    type: string;
    deviceSize: number;
    deviceFirstBlock: number;
    deviceLastBlock: number;
    downloadSize: number | null;
    downloadFirstBlock: number | null;
    downloadLastBlock: number | null;
    portalSize: number | null;
    portalFirstBlock: number | null;
    portalLastBlock: number | null;
    updated: number;
}

export interface SensorTableRow {
    id: number;
    name: string;
    unit: string;
    currentReading: number | null;
    trend: number | null;
    moduleId: number | null;
}

export interface DownloadTableRow {
    id: number;
    stationId: number;
    deviceId: string;
    generation: string;
    path: string;
    type: string;
    timestamp: number;
    url: string;
    size: number;
    blocks: string;
    firstBlock: number;
    lastBlock: number;
    uploaded: number | null;
}

export interface NotesTableRow {
    id: number;
    stationId: number;
    createdAt: string;
    updatedAt: string;
    notes: string;
    notesObject: any | null;
}

export interface SettingsTableRow {
    id: number;
    settings: string;
    settingsObject: any | null;
    createdAt: string;
    updatedAt: string;
}

export interface AccountsTableRow {
    id: number;
    name: string;
    email: string;
    portalId: string;
    token: string;
    usedAt: Date;
}
