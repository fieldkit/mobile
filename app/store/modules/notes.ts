import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { ServiceRef } from "@/services";
import { Station } from "../types";
import { NotesTableRow } from "../row-types";
import { SaveNotesAction, NameStationLocationAction, ActionTypes } from "../actions";
import {
    MutationTypes,
    UpdateNoteMutation,
    NoteMedia,
    NoteHelp,
    NoteData,
    NoteForm,
    NoteUpdate,
    RemoveNoteMediaMutation,
    AttachNoteMediaMutation,
} from "../mutations";

export enum Keys {
    StudyObjective = "studyObjective",
    SitePurpose = "sitePurpose",
    SiteCriteria = "siteCriteria",
    SiteDescription = "siteDescription",
}

export class NotesState {
    public stations: { [index: number]: Notes } = {};
}

export class Notes {
    public readonly help = {
        [Keys.StudyObjective]: new NoteHelp(_L("studyObjective"), _L("studyObjectiveInstruction")),
        [Keys.SitePurpose]: new NoteHelp(_L("siteLocation"), _L("siteLocationInstruction")),
        [Keys.SiteCriteria]: new NoteHelp(_L("siteCriteria"), _L("siteCriteriaInstruction")),
        [Keys.SiteDescription]: new NoteHelp(_L("siteDescription"), _L("siteDescriptionInstruction")),
    };
    constructor(
        public readonly stationId: number,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly modified = false,
        public readonly location: string = "",
        public readonly notes: { [index: string]: NoteData } = {},
        public readonly photos: NoteMedia[] = [],
        public readonly audio: NoteMedia[] = []
    ) {}

    public get studyObjective(): NoteForm {
        const help = this.help[Keys.StudyObjective];
        const data = this.notes[Keys.StudyObjective] || new NoteData();
        return new NoteForm(help, data.body, data.photos, data.audio);
    }

    public get sitePurpose(): NoteForm {
        const help = this.help[Keys.SitePurpose];
        const data = this.notes[Keys.SitePurpose] || new NoteData();
        return new NoteForm(help, data.body, data.photos, data.audio);
    }

    public get siteCriteria(): NoteForm {
        const help = this.help[Keys.SiteCriteria];
        const data = this.notes[Keys.SiteCriteria] || new NoteData();
        return new NoteForm(help, data.body, data.photos, data.audio);
    }

    public get siteDescription(): NoteForm {
        const help = this.help[Keys.SiteDescription];
        const data = this.notes[Keys.SiteDescription] || new NoteData();
        return new NoteForm(help, data.body, data.photos, data.audio);
    }

    private isNoteCompleted(note: NoteData): boolean {
        return note.body.length > 0 || note.audio.length > 0 || note.photos.length > 0;
    }

    public get valid(): boolean {
        return true;
    }

    public get completed(): string {
        const notes = [this.studyObjective, this.sitePurpose, this.siteCriteria, this.siteDescription];
        const total = notes.length + 1;
        const filled = notes.filter(this.isNoteCompleted.bind(this));
        const done = filled.length + (this.photos.length > 0 ? 1 : 0);
        const percentage = (done / total) * 100;
        return percentage.toFixed(0);
    }

    public allMedia(): NoteMedia[] {
        const allNotes = [this.studyObjective, this.sitePurpose, this.siteCriteria, this.siteDescription];
        const notesAudio = _.flatten(allNotes.map((n) => n.audio));
        const notesPhotos = _.flatten(allNotes.map((n) => n.photos));
        return [...this.photos, ...notesPhotos, ...notesAudio];
    }

    public changeLocation(newLocation: string): Notes {
        return new Notes(this.stationId, this.createdAt, new Date(), true, newLocation, this.notes, this.photos, this.audio);
    }

    public removeMedia(key: string | null, media: NoteMedia): Notes {
        if (!key) {
            const newPhotos = NoteMedia.except(this.photos, media);
            const newAudio = NoteMedia.except(this.audio, media);
            return new Notes(this.stationId, this.createdAt, new Date(), true, this.location, this.notes, newPhotos, newAudio);
        }

        const newNotes = { ...this.notes };
        const old = this.notes[key] || new NoteData();
        const newPhotos = NoteMedia.except(old.photos, media);
        const newAudio = NoteMedia.except(old.audio, media);
        newNotes[key] = new NoteData(old.body, newPhotos, newAudio);
        return new Notes(this.stationId, this.createdAt, new Date(), true, this.location, newNotes, this.photos, this.audio);
    }

    public attachAudio(key: string | null, audio: NoteMedia): Notes {
        if (!key) {
            const newAudio = _.uniqBy([...this.audio, audio], (m) => m.path);
            return new Notes(this.stationId, this.createdAt, new Date(), true, this.location, this.notes, this.photos, newAudio);
        }

        const newNotes = { ...this.notes };
        const old = this.notes[key] || new NoteData();
        const newAudio = _.uniqBy([...old.audio, audio], (m) => m.path);
        newNotes[key] = new NoteData(old.body, old.photos, newAudio);
        return new Notes(this.stationId, this.createdAt, new Date(), true, this.location, newNotes, this.photos, this.audio);
    }

    public attachPhoto(key: string | null, photo: NoteMedia): Notes {
        if (!key) {
            const newPhotos = _.uniqBy([...this.photos, photo], (m) => m.path);
            return new Notes(this.stationId, this.createdAt, new Date(), true, this.location, this.notes, newPhotos, this.audio);
        }

        const newNotes = { ...this.notes };
        const old = this.notes[key] || new NoteData();
        const newPhotos = _.uniqBy([...old.photos, photo], (m) => m.path);
        newNotes[key] = new NoteData(old.body, newPhotos, old.audio);
        return new Notes(this.stationId, this.createdAt, new Date(), true, this.location, newNotes, this.photos, this.audio);
    }

    public saved(): Notes {
        return new Notes(this.stationId, this.createdAt, this.updatedAt, false, this.location, this.notes, this.photos, this.audio);
    }

    public updateNote(key: string, update: NoteUpdate): Notes {
        const newNotes = { ...this.notes };
        const old = this.notes[key] || new NoteData();
        newNotes[key] = new NoteData(update.body, old.photos, old.audio);
        return new Notes(this.stationId, this.createdAt, new Date(), true, this.location, newNotes, this.photos, this.audio);
    }

    public static fromRow(row: NotesTableRow): Notes {
        const n = new Notes(row.stationId, new Date(row.createdAt), new Date(row.updatedAt));
        Object.assign(n, row.notesObject);
        return n;
    }
}

type ActionParameters = ActionContext<NotesState, never>;

const getters = {};

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.LOAD]: ({ commit, dispatch, state }: ActionParameters) => {
            return services
                .db()
                .getAllNotes()
                .then((all) => all.map((row) => Notes.fromRow(row)))
                .then((all) => commit(MutationTypes.LOAD_NOTES_ALL, all));
        },
        [ActionTypes.RENAME_STATION]: ({ commit, dispatch, state }: ActionParameters) => {
            //
        },
        [ActionTypes.CONFIGURE_STATION_SCHEDULES]: ({ commit, dispatch, state }: ActionParameters) => {
            //
        },
        [ActionTypes.STATION_LOCATION]: ({ commit, dispatch, state }: ActionParameters, payload: NameStationLocationAction) => {
            commit(MutationTypes.NOTES_LOCATION, payload);

            return services.db().addOrUpdateNotes(state.stations[payload.stationId]);
        },
        [ActionTypes.SAVE_NOTES]: ({ commit, dispatch, state }: ActionParameters, payload: SaveNotesAction) => {
            const notes = state.stations[payload.stationId];
            console.log(`notes: ${JSON.stringify(notes)}`);
            return services
                .db()
                .addOrUpdateNotes(notes)
                .then(() => {
                    commit(MutationTypes.NOTES_SAVED, payload);
                });
        },
        [ActionTypes.AUTHENTICATED]: ({ commit, dispatch, state }: ActionParameters) => {
            const syncing = services
                .updater()
                .addOrUpdateStations()
                .catch(() => {
                    // Don't let this error prevent authentication.
                    return {};
                });

            return Promise.resolve({
                syncing: syncing,
            });
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: NotesState) => {
        Object.assign(state, new NotesState());
    },
    [MutationTypes.STATIONS]: (state: NotesState, stations: Station[]) => {
        return stations.map((station) => {
            if (!station.id) throw new Error("station missing id");
            if (!state.stations[station.id]) {
                Vue.set(state.stations, station.id, new Notes(station.id, new Date(), new Date()));
            }
            return state.stations[station.id];
        });
    },
    [MutationTypes.UPDATE_NOTE]: (state: NotesState, payload: UpdateNoteMutation) => {
        if (!payload.key) throw new Error(`key is required`);
        if (!payload.update) throw new Error(`update is required`);
        if (!state.stations[payload.stationId]) {
            state.stations[payload.stationId] = new Notes(payload.stationId, new Date(), new Date());
        }
        state.stations[payload.stationId] = state.stations[payload.stationId].updateNote(payload.key, payload.update);
        const notes = state.stations[payload.stationId];
        console.log(`update-note: ${JSON.stringify(notes)}`);
        console.log(`update-note: ${JSON.stringify(payload)}`);
    },
    [MutationTypes.ATTACH_NOTE_MEDIA]: (state: NotesState, payload: AttachNoteMediaMutation) => {
        if (!payload.media) throw new Error(`media is required`);
        if (!state.stations[payload.stationId]) {
            state.stations[payload.stationId] = new Notes(payload.stationId, new Date(), new Date());
        }
        if (payload.audio) {
            state.stations[payload.stationId] = state.stations[payload.stationId].attachAudio(payload.key, payload.media);
        } else {
            state.stations[payload.stationId] = state.stations[payload.stationId].attachPhoto(payload.key, payload.media);
        }
    },
    [MutationTypes.REMOVE_NOTE_MEDIA]: (state: NotesState, payload: RemoveNoteMediaMutation) => {
        state.stations[payload.stationId] = state.stations[payload.stationId].removeMedia(payload.key, payload.media);
    },
    [MutationTypes.NOTES_LOCATION]: (state: NotesState, payload: { stationId: number; location: string }) => {
        if (!state.stations[payload.stationId]) {
            state.stations[payload.stationId] = new Notes(payload.stationId, new Date(), new Date());
        }
        state.stations[payload.stationId] = state.stations[payload.stationId].changeLocation(payload.location);
    },
    [MutationTypes.LOAD_NOTES_ALL]: (state: NotesState, notes: Notes[]) => {
        return notes.map((notes) => Vue.set(state.stations, notes.stationId, notes));
    },
    [MutationTypes.NOTES_SAVED]: (state: NotesState, payload: { stationId: number }) => {
        state.stations[payload.stationId] = state.stations[payload.stationId].saved();
    },
};

type ModuleType = Module<NotesState, never>;

export const notes = (services: ServiceRef): ModuleType => {
    const state = () => new NotesState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
