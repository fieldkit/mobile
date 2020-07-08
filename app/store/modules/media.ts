import _ from "lodash";
import Vue from "../../wrappers/vue";
import Camera from "../../wrappers/camera";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Services, ServiceRef } from "./utilities";

export class LocalAudio {
    constructor(public readonly path: string) {}
}

export class LocalPhoto {
    constructor(public readonly path: string) {}
}

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
    public audios: LocalAudio[] = [];
    public photos: LocalPhoto[] = [];
    public recording: ActiveRecording | null = null;
}

type ActionParameters = { commit: any; dispatch: any; state: MediaState };

export const AUDIO_RECORDING_PROGRESS = "AUDIO_RECORDING_PROGRESS";

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
                commit(AUDIO_RECORDING_PROGRESS, state.recording.pause());
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
                commit(AUDIO_RECORDING_PROGRESS, null);
            });
    },
    [ActionTypes.TAKE_PICTURE]: ({ commit, dispatch, state }: ActionParameters, options: any) => {
        return Camera.takePicture({
            keepAspectRatio: true,
            saveToGallery: true,
            allowsEditing: false,
        });
    },
    [ActionTypes.FIND_PICTURE]: ({ commit, dispatch, state }: ActionParameters, options: any) => {
        return Camera.findPicture(options);
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
};

const state = () => new MediaState();

export const media = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
