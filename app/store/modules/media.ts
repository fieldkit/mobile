import _ from "lodash";
import Vue from "vue";
import Camera from "../../wrappers/camera";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Services, ServiceRef } from "./utilities";
import { IncomingImage } from "../../services/types";
import { serializePromiseChain } from "../../utilities";

export const AUDIO_RECORDING_PROGRESS = "AUDIO_RECORDING_PROGRESS";
export const CACHE_PHOTO = "CACHE_PHOTO";

export class ActiveRecording {
    private readonly started: Date = new Date();

    constructor(public readonly path: string, public readonly paused: boolean = false, private readonly accumulated = 0) {}

    public get duration(): number {
        if (!this.paused) {
            return this.accumulated + this.elapsed;
        }
        return this.accumulated;
    }

    private get elapsed(): number {
        return new Date().getTime() - this.started.getTime();
    }

    public pause(): ActiveRecording {
        return new ActiveRecording(this.path, true, this.duration);
    }

    public resume(): ActiveRecording {
        return new ActiveRecording(this.path, false, this.duration);
    }

    public stop(): ActiveRecording {
        return new ActiveRecording(this.path, true, this.duration);
    }
}

export class MediaState {
    public services: ServiceRef = new ServiceRef();
    public recording: ActiveRecording | null = null;
    public photoCache: { [index: string]: any } = {};
}

type ActionParameters = { commit: any; dispatch: any; state: MediaState };

const getters = {};

const actions = {
    [ActionTypes.AUDIO_RECORD]: ({ commit, dispatch, state }: ActionParameters) => {
        if (state.recording) throw new Error("already recording");
        return state.services
            .audio()
            .startAudioRecording()
            .then(path => {
                commit(AUDIO_RECORDING_PROGRESS, new ActiveRecording(path));
            });
    },
    [ActionTypes.AUDIO_PAUSE]: ({ commit, dispatch, state }: ActionParameters) => {
        if (!state.recording) throw new Error("no recording");
        return state.services
            .audio()
            .pauseAudioRecording(state.recording)
            .then(() => {
                if (!state.recording) throw new Error("no recording");
                return commit(AUDIO_RECORDING_PROGRESS, state.recording.pause());
            });
    },
    [ActionTypes.AUDIO_RESUME]: ({ commit, dispatch, state }: ActionParameters) => {
        if (!state.recording) throw new Error("no recording");
        return state.services
            .audio()
            .resumeAudioRecording(state.recording)
            .then(() => {
                if (!state.recording) throw new Error("no recording");
                commit(AUDIO_RECORDING_PROGRESS, state.recording.resume());
            });
    },
    [ActionTypes.AUDIO_STOP]: ({ commit, dispatch, state }: ActionParameters) => {
        if (!state.recording) throw new Error("no recording");
        return state.services
            .audio()
            .stopAudioRecording(state.recording)
            .then(() => {
                if (!state.recording) throw new Error("no recording");
                const recording = state.recording;
                commit(AUDIO_RECORDING_PROGRESS, null);
                return recording;
            });
    },
    [ActionTypes.TAKE_PICTURE]: ({ commit, dispatch, state }: ActionParameters, options: any) => {
        return Camera.takePicture({
            keepAspectRatio: true,
            saveToGallery: true,
            allowsEditing: false,
        }).then(source => {
            return dispatch(ActionTypes.SAVE_PICTURE, { source: source });
        });
    },
    [ActionTypes.FIND_PICTURE]: ({ commit, dispatch, state }: ActionParameters, options: any) => {
        return Camera.findPicture(options)
            .then(selection => selection[0])
            .then(source => {
                return dispatch(ActionTypes.SAVE_PICTURE, { source: source });
            });
    },
    [ActionTypes.SAVE_PICTURE]: ({ commit, dispatch, state }: ActionParameters, payload: { source: any }) => {
        return state.services
            .images()
            .saveImage(new IncomingImage(payload.source))
            .then(saved => {
                commit(CACHE_PHOTO, { path: saved.path, source: saved.source });
                return saved;
            });
    },
    [ActionTypes.LOAD_PICTURES]: ({ commit, dispatch, state }: ActionParameters, payload: { paths: string[] }) => {
        return serializePromiseChain(payload.paths, path =>
            state.services
                .images()
                .fromFile(path)
                .then(saved => {
                    commit(CACHE_PHOTO, { path: saved.path, source: saved.source });
                    return {};
                })
        );
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: MediaState, error: string) => {
        Object.assign(state, new MediaState());
    },
    [MutationTypes.SERVICES]: (state: MediaState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
    },
    [AUDIO_RECORDING_PROGRESS]: (state: MediaState, payload: ActiveRecording) => {
        Vue.set(state, "recording", payload);
    },
    [CACHE_PHOTO]: (state: MediaState, payload: { path: string; source: any }) => {
        Vue.set(state.photoCache, payload.path, payload.source);
    },
};

const state = () => new MediaState();

export const media = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
