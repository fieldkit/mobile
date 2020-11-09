export interface StationTableRow {
    id: number;
    deviceId: string;
    generationId: string;
    name: string;
    archived: boolean;
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
    generationId: string | null;
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
    notesObject: Record<string, unknown> | undefined;
}

export interface SettingsTableRow {
    id: number;
    settings: string;
    createdAt: string;
    updatedAt: string;
    settingsObject: Record<string, unknown> | undefined;
}

export interface AccountsTableRow {
    portalId: number;
    id: number;
    name: string;
    email: string;
    token: string;
    usedAt: Date;
}

export interface NotificationsTableRow {
    id: number;
    key: string;
    kind: string;
    created: number;
    silenced: boolean;
    dismissed_at: number; // TODO Fix naming
    satisfied_at: number; // TODO Fix naming
    project: string;
    user: string;
    station: string;
    actions: string;
}

export interface QueriedNotificationsTableRow {
    id: number;
    key: string;
    kind: string;
    created: number;
    silenced: boolean;
    dismissed_at: number; // TODO Fix naming
    satisfied_at: number; // TODO Fix naming
    project: Record<string, unknown>;
    user: Record<string, unknown>;
    station: Record<string, unknown>;
    actions: string;
}

export interface FirmwareTableRow {
    id: number;
    time: number;
    url: string;
    path: string;
    meta: Record<string, unknown>;
    module: string;
    profile: string;
    etag: string;
    buildTime: number;
    buildNumber: string;
}

export interface PortalConfigTableRow {
    baseUri: string;
    ingestionUri: string;
}

export interface StationAddressRow {
    deviceId: string;
    url: string;
    time: string;
}
