import _ from "lodash";
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Services, ServiceRef } from "./utilities";
import { RouteState } from "../../routes/navigate";
import { Station } from "../types";

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
    constructor(public readonly help: NoteHelp, public readonly body: string = "", public photos: NoteMedia[] = [], public audio: NoteMedia[] = []) {}
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
    public activeStationId: number | null = null;
    public stations: { [index: number]: Notes } = {};

    public station(id: number): Notes {
        if (!this.stations[id]) {
            Vue.set(this.stations, id, new Notes(id));
        }
        return this.stations[id];
    }
}

export class Note {
    constructor(public readonly id: number, public readonly body: string, public readonly createdAt: Date, public readonly media: NoteMedia[] = []) {}
}

export class Notes {
    public readonly notes: Note[] = [];
    public location: string = "";
    public form: NotesForm = new NotesForm();

    public get completed(): number {
        return 0;
    }

    constructor(public readonly stationId: number) {}
}

type ActionParameters = { commit: any; dispatch: any; state: NotesState };

const getters = {};

const actions = {
    [ActionTypes.RENAME_STATION]: ({ commit, dispatch, state }: ActionParameters, payload: any) => {
        return;
    },
    [ActionTypes.CONFIGURE_STATION_SCHEDUES]: ({ commit, dispatch, state }: ActionParameters, payload: any) => {
        return;
    },
    [ActionTypes.CONFIGURE_STATION_SCHEDUES]: ({ commit, dispatch, state }: ActionParameters, payload: any) => {
        return;
    },
    [ActionTypes.STATION_LOCATION]: ({ commit, dispatch, state }: ActionParameters, payload: { stationId: number; location: string }) => {
        return commit(MutationTypes.STATION_LOCATION, payload);
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
        return stations.map(station => {
            if (!station.id) {
                throw new Error("station missing id");
            }
            return state.station(station.id);
        });
    },
    [MutationTypes.NAVIGATION]: (state: NotesState, route: RouteState) => {
        const stationId = route?.props?.stationId;
        if (stationId) {
            Vue.set(state, "activeStationId", route.props.stationId);
        } else {
            Vue.set(state, "activeStationId", null);
        }
    },
    [MutationTypes.STATION_LOCATION]: (state: NotesState, payload: { stationId: number; location: string }) => {
        state.station(payload.stationId).location = payload.location;
    },
    [MutationTypes.STATION_NOTES]: (state: NotesState, payload: { stationId: number; form: NotesForm }) => {
        state.station(payload.stationId).form = _.cloneDeep(payload.form);
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
