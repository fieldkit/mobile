import _ from "lodash";
import Vue from "../../wrappers/vue";
// import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Services, ServiceRef } from "./utilities";
import { RouteState } from "../../routes/navigate";

export class NotesState {
    public services: ServiceRef = new ServiceRef();
    public activeStationId: number | null = null;
    public stations: { [index: string]: Notes } = {};
}

export class NoteMedia {
    constructor(public id: number, public path: string) {}
}

export class NoteAudio extends NoteMedia {}

export class NotePhoto extends NoteMedia {}

export class Note {
    constructor(public readonly id: number, public readonly body: string, public readonly createdAt: Date, public readonly media: NoteMedia[] = []) {}
}

export class Notes {
    public readonly notes: Note[] = [];

    constructor(public readonly stationId: number) {}
}

// type ActionParameters = { commit: any; dispatch: any; state: NotesState };

const getters = {};

const actions = {};

const mutations = {
    [MutationTypes.RESET]: (state: NotesState, error: string) => {
        Object.assign(state, new NotesState());
    },
    [MutationTypes.SERVICES]: (state: NotesState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
    },
    [MutationTypes.NAVIGATION]: (state: NotesState, route: RouteState) => {
        const stationId = route?.props?.stationId;
        if (stationId) {
            Vue.set(state, "activeStationId", route.props.stationId);
        } else {
            Vue.set(state, "activeStationId", null);
        }
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
