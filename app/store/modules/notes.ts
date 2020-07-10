import _ from "lodash";
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Services, ServiceRef } from "./utilities";
import { Station } from "../types";
import { NotesTableRow } from "../row-types";

export class NoteMedia {
    constructor(public readonly path: string) {}

    public static onlyAudio(media: NoteMedia[]): NoteMedia[] {
        return media.filter(NoteMedia.isAudio);
    }

    public static onlyPhotos(media: NoteMedia[]): NoteMedia[] {
        return media.filter(NoteMedia.isPhoto);
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

export class NoteForm {
    constructor(
        public readonly help: NoteHelp,
        public readonly body: string = "",
        public photos: NoteMedia[] = [],
        public audio: NoteMedia[] = []
    ) {}
}

export class NotesForm {
    public readonly studyObjective: NoteForm = new NoteForm(new NoteHelp(_L("studyObjective"), _L("studyObjectiveInstruction")));
    public readonly sitePurpose: NoteForm = new NoteForm(new NoteHelp(_L("siteLocation"), _L("siteLocationInstruction")));
    public readonly siteCriteria: NoteForm = new NoteForm(new NoteHelp(_L("siteCriteria"), _L("siteCriteriaInstruction")));
    public readonly siteDescription: NoteForm = new NoteForm(new NoteHelp(_L("siteDescription"), _L("siteDescriptionInstruction")));

    constructor(public photos: NoteMedia[] = [], public audio: NoteMedia[] = []) {}
}

export class NotesState {
    public services: ServiceRef = new ServiceRef();
    public stations: { [index: number]: Notes } = {};

    public station(id: number): Notes {
        if (!this.stations[id]) {
            Vue.set(this.stations, id, new Notes(id));
        }
        return this.stations[id];
    }
}

export class Note {
    constructor(
        public readonly id: number,
        public readonly body: string,
        public readonly createdAt: Date,
        public readonly media: NoteMedia[] = []
    ) {}
}

export class Notes {
    public readonly notes: Note[] = [];
    public location: string = "";
    public form: NotesForm = new NotesForm();

    public get completed(): number {
        return 0;
    }

    public allMedia(): NoteMedia[] {
        const allNotes = [this.form.studyObjective, this.form.sitePurpose, this.form.siteCriteria, this.form.siteDescription];

        const notesAudio = _.flatten(allNotes.map((n) => n.audio));
        const notesPhotos = _.flatten(allNotes.map((n) => n.photos));
        return [...this.form.photos, ...notesPhotos, ...notesAudio];
    }

    constructor(public readonly stationId: number) {}

    public static fromRow(row: NotesTableRow): Notes {
        const n = new Notes(row.stationId);
        Object.assign(n, row.notesObject);
        return n;
    }
}

type ActionParameters = { commit: any; dispatch: any; state: NotesState };

export const LOAD_NOTES_ALL = "LOAD_NOTES_ALL";
export const NOTES_LOCATION = "NOTES_LOCATION";
export const NOTES_FORM = "NOTES_FORM";

const getters = {};

const actions = {
    [ActionTypes.LOAD]: ({ commit, dispatch, state }: ActionParameters, payload: any) => {
        return state.services
            .db()
            .getAllNotes()
            .then((all) => all.map((row) => Notes.fromRow(row)))
            .then((all) => commit(LOAD_NOTES_ALL, all));
    },
    [ActionTypes.RENAME_STATION]: ({ commit, dispatch, state }: ActionParameters, payload: any) => {},
    [ActionTypes.CONFIGURE_STATION_SCHEDUES]: ({ commit, dispatch, state }: ActionParameters, payload: any) => {},
    [ActionTypes.CONFIGURE_STATION_SCHEDUES]: ({ commit, dispatch, state }: ActionParameters, payload: any) => {},
    [ActionTypes.STATION_LOCATION]: ({ commit, dispatch, state }: ActionParameters, payload: { stationId: number; location: string }) => {
        commit(NOTES_LOCATION, payload);

        return state.services.db().addOrUpdateNotes(state.stations[payload.stationId]);
    },
    [ActionTypes.UPDATE_NOTES_FORM]: ({ commit, dispatch, state }: ActionParameters, payload: { stationId: number; form: NotesForm }) => {
        commit(NOTES_FORM, payload);

        return state.services.db().addOrUpdateNotes(state.stations[payload.stationId]);
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: NotesState, error: string) => {
        Object.assign(state, new NotesState());
    },
    [MutationTypes.SERVICES]: (state: NotesState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
    },
    [MutationTypes.STATIONS]: (state: NotesState, stations: Station[]) => {
        return stations.map((station) => {
            if (!station.id) {
                throw new Error("station missing id");
            }
            return state.station(station.id);
        });
    },
    [NOTES_LOCATION]: (state: NotesState, payload: { stationId: number; location: string }) => {
        state.station(payload.stationId).location = payload.location;
    },
    [NOTES_FORM]: (state: NotesState, payload: { stationId: number; form: NotesForm }) => {
        state.station(payload.stationId).form = _.cloneDeep(payload.form);
    },
    [LOAD_NOTES_ALL]: (state: NotesState, notes: Notes[]) => {
        return notes.map((notes) => Vue.set(state.stations, notes.stationId, notes));
    },
};

const state = () => new NotesState();

export const notes = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
