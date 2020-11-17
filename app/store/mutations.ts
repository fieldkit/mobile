export enum MutationTypes {
    SUCCESS = `SUCCESS`,
    ERROR = `ERROR`,
    NAVIGATION = "NAVIGATION",
    RESET = "RESET",

    // Phone stuff

    PHONE_NETWORK = "PHONE_NETWORK",
    PHONE_LOCATION = "PHONE_LOCATION",

    // Discovery / Comms

    FIND = "FIND",
    LOSE = "LOSE",

    STATIONS = "STATIONS",
    UPDATE = "UPDATE",

    TRANSFER_OPEN = "TRANSFER_OPEN",
    TRANSFER_PROGRESS = "TRANSFER_PROGRESS",
    TRANSFER_CLOSE = "TRANSFER_CLOSE",

    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",

    STATION_QUERIED = "STATION_QUERIED",
    STATION_ACTIVITY = "STATION_ACTIVITY",

    UPDATE_NOTE = "UPDATE_NOTE",
    ATTACH_NOTE_MEDIA = "ATTACH_NOTE_MEDIA",
    REMOVE_NOTE_MEDIA = "REMOVE_NOTE_MEDIA",
    CACHE_PHOTO = "CACHE_PHOTO",

    AUDIO_RECORDING_PROGRESS = "AUDIO_RECORDING_PROGRESS",

    LOAD_SETTINGS = "LOAD_SETTINGS",
    UPDATE_SETTINGS = "UPDATE_SETTINGS",

    LOAD_ACCOUNTS = "LOAD_ACCOUNTS",
    LOGOUT_ACCOUNTS = "LOGOUT_ACCOUNTS",

    LOAD_NOTIFICATIONS = "LOAD_NOTIFICATIONS",

    AVAILABLE_FIRMWARE = "AVAILABLE_FIRMWARE",

    SET_CURRENT_USER = "SET_CURRENT_USER",

    SET_CURRENT_PORTAL_ENV = "SET_CURRENT_PORTAL_ENV",

    LOAD_NOTES_ALL = "LOAD_NOTES_ALL",
    NOTES_LOCATION = "NOTES_LOCATION",
    NOTES_SAVED = "NOTES_SAVED",

    UPGRADE_STATUS = "UPGRADE_STATUS",
    UPGRADE_PROGRESS = "UPGRADE_PROGRESS",

    STATION_PORTAL_STATUS = "STATION_PORTAL_STATUS",
}

export class NoteMedia {
    constructor(public readonly path: string, public readonly key: string) {}

    public static except(media: NoteMedia[], removing: NoteMedia): NoteMedia[] {
        return media.filter((m) => m.path !== removing.path);
    }

    public static onlyAudio(media: NoteMedia[]): NoteMedia[] {
        return media.filter(NoteMedia.isAudio.bind(this));
    }

    public static onlyPhotos(media: NoteMedia[]): NoteMedia[] {
        return media.filter(NoteMedia.isPhoto.bind(this));
    }

    public static isPhoto(nm: NoteMedia): boolean {
        return !NoteMedia.isAudio(nm);
    }

    public static isAudio(nm: NoteMedia): boolean {
        return /(m4a|caf)$/.test(nm.path.toLowerCase());
    }
}

export class NoteHelp {
    constructor(public readonly title: string, public readonly instructions: string) {}
}

export class NoteData {
    constructor(public readonly body: string = "", public photos: NoteMedia[] = [], public audio: NoteMedia[] = []) {}
}

export class NoteForm {
    constructor(
        public readonly help: NoteHelp,
        public readonly body: string = "",
        public photos: NoteMedia[] = [],
        public audio: NoteMedia[] = []
    ) {}
}

export interface NoteUpdate {
    body: string;
}

export class UpdateNoteMutation {
    type = MutationTypes.UPDATE_NOTE;

    constructor(public readonly stationId: number, public readonly key: string, public readonly update: NoteUpdate) {}
}

export class AttachNoteMediaMutation {
    type = MutationTypes.ATTACH_NOTE_MEDIA;

    constructor(
        public readonly stationId: number,
        public readonly key: string | null,
        public readonly media: NoteMedia,
        public readonly audio: boolean
    ) {}
}

export class RemoveNoteMediaMutation {
    type = MutationTypes.REMOVE_NOTE_MEDIA;

    constructor(public readonly stationId: number, public readonly key: string | null, public readonly media: NoteMedia) {}
}

export class OpenProgressMutation {
    type = MutationTypes.TRANSFER_OPEN;

    constructor(public readonly deviceId: string, public readonly downloading: boolean, public readonly totalBytes: number) {}
}
