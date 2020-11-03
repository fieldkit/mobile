import Vue from "vue";
import { ActionContext, Module } from "vuex";
import * as Camera from "@nativescript/camera";
import * as ImagePicker from "@nativescript/imagepicker";
import { ActionTypes } from "../actions";
import { MutationTypes } from "../mutations";
import { ServiceRef } from "@/services";
import { ImageAsset, SavedImage, IncomingImage } from "@/services/types";
import { serializePromiseChain } from "@/utilities";

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
    public recording: ActiveRecording | null = null;
    public photoCache: { [index: string]: ImageAsset } = {};
}

type ActionParameters = ActionContext<MediaState, never>;

const getters = {};

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.AUDIO_RECORD]: async ({ commit, dispatch, state }: ActionParameters) => {
            if (state.recording) throw new Error("already recording");
            await services
                .audio()
                .startAudioRecording()
                .then((path: string) => {
                    commit(AUDIO_RECORDING_PROGRESS, new ActiveRecording(path));
                });
        },
        [ActionTypes.AUDIO_PAUSE]: async ({ commit, dispatch, state }: ActionParameters) => {
            if (!state.recording) throw new Error("no recording");
            await services
                .audio()
                .pauseAudioRecording()
                .then(() => {
                    if (!state.recording) throw new Error("no recording");
                    return commit(AUDIO_RECORDING_PROGRESS, state.recording.pause());
                });
        },
        [ActionTypes.AUDIO_RESUME]: async ({ commit, dispatch, state }: ActionParameters) => {
            if (!state.recording) throw new Error("no recording");
            await services
                .audio()
                .resumeAudioRecording()
                .then(() => {
                    if (!state.recording) throw new Error("no recording");
                    commit(AUDIO_RECORDING_PROGRESS, state.recording.resume());
                });
        },
        [ActionTypes.AUDIO_STOP]: async ({ commit, dispatch, state }: ActionParameters) => {
            if (!state.recording) throw new Error("no recording");
            await services
                .audio()
                .stopAudioRecording()
                .then(() => {
                    if (!state.recording) throw new Error("no recording");
                    const recording = state.recording;
                    commit(AUDIO_RECORDING_PROGRESS, null);
                    return recording;
                });
        },
        [ActionTypes.TAKE_PICTURE]: ({ commit, dispatch, state }: ActionParameters) => {
            return Camera.takePicture({
                keepAspectRatio: true,
                saveToGallery: true,
                allowsEditing: false,
            }).then((asset) => {
                return dispatch(ActionTypes.SAVE_PICTURE, { asset: asset });
            });
        },
        [ActionTypes.FIND_PICTURE]: ({ commit, dispatch, state }: ActionParameters) => {
            const context = ImagePicker.create({
                mode: "single",
            });

            return context
                .authorize()
                .then(() => context.present())
                .then((selection) => selection[0])
                .then((asset) => {
                    return dispatch(ActionTypes.SAVE_PICTURE, { asset: asset });
                });
        },
        [ActionTypes.SAVE_PICTURE]: async ({ commit, dispatch, state }: ActionParameters, payload: { asset: ImageAsset }) => {
            await services
                .images()
                .saveImage(new IncomingImage(payload.asset))
                .then((saved: SavedImage) => {
                    commit(CACHE_PHOTO, saved);
                });
        },
        [ActionTypes.LOAD_PICTURES]: async ({ commit, dispatch, state }: ActionParameters, payload: { paths: string[] }) => {
            await serializePromiseChain(payload.paths, (path) =>
                services
                    .images()
                    .fromFile(path)
                    .then((saved: SavedImage) => {
                        commit(CACHE_PHOTO, saved);
                    })
            );
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: MediaState) => {
        Object.assign(state, new MediaState());
    },
    [AUDIO_RECORDING_PROGRESS]: (state: MediaState, payload: ActiveRecording) => {
        Vue.set(state, "recording", payload);
    },
    [CACHE_PHOTO]: (state: MediaState, payload: { path: string; source: unknown }) => {
        Vue.set(state.photoCache, payload.path, payload.source);
    },
};

type ModuleType = Module<MediaState, never>;

export const media = (services: ServiceRef): ModuleType => {
    const state = () => new MediaState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
