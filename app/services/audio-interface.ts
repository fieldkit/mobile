import { isAndroid, path, knownFolders, Folder } from "@nativescript/core";
import { AudioPlayerOptions, AudioRecorderOptions, TNSPlayer, TNSRecorder } from "nativescript-audio";
import { getPathTimestamp } from "@/lib/fs";

export class VolumeMutedError extends Error {
    public readonly volumeMutedError = true;

    public static isInstance(error: VolumeMutedError | undefined): boolean {
        return (error && error.volumeMutedError) || false;
    }
}

export class NoRecordingAllowedError extends Error {
    public readonly noRecordingAllowedError = true;

    constructor() {
        super("recording disabled");
    }

    public static isInstance(error: NoRecordingAllowedError | undefined): boolean {
        return (error && error.noRecordingAllowedError) || false;
    }
}

export default class AudioInterface {
    private readonly player: TNSPlayer;
    private readonly recorder: TNSRecorder;
    private readonly folder: Folder;
    private readonly extension: string;
    private readonly options: {
        format?: number;
        encoder?: number;
    };

    constructor() {
        this.player = new TNSPlayer();
        this.player.debug = true;
        this.recorder = new TNSRecorder();
        this.folder = knownFolders.documents().getFolder("media/audio");

        if (isAndroid) {
            this.extension = ".m4a";
            this.options = {
                format: 2 /* android.media.MediaRecorder.OutputFormat.MPEG_4 */,
                encoder: 3 /* android.media.MediaRecorder.AudioEncoder.AAC */,
            };
        } else {
            this.extension = ".caf";
            this.options = {};
        }
    }

    public startAudioRecording(): Promise<string> {
        if (!TNSRecorder.CAN_RECORD()) {
            return Promise.reject(new NoRecordingAllowedError());
        }

        const filename = path.join(this.folder.path, getPathTimestamp(new Date()) + this.extension);
        const recorderOptions: AudioRecorderOptions = Object.assign({}, this.options, {
            filename: filename,
            errorCallback: (errorObject) => {
                console.log("audio: error", errorObject);
            },
            infoCallback: (infoObject) => {
                console.log("audio: info", infoObject);
            },
        });

        return this.recorder.start(recorderOptions).then(() => {
            return filename;
        });
    }

    public async pauseAudioRecording(): Promise<void> {
        await this.recorder.pause();
    }

    public async resumeAudioRecording(): Promise<void> {
        await this.recorder.resume();
    }

    public async stopAudioRecording(): Promise<void> {
        await this.recorder.stop();
    }

    public isPlaying(): boolean {
        return this.player.isAudioPlaying();
    }

    public playRecordedFile(path: string, doneCallback: ({ error: boolean }) => void): Promise<void> {
        console.log("audio:play", path, this.player.volume);
        if (!path) return Promise.reject(new Error("no audio file"));
        if (!doneCallback) return Promise.reject(new Error("no callback"));
        if (this.player.volume == 0) {
            this.player.volume = 1;
            console.log("audio:play:muted", this.player.volume);
            /*
			// Wish this worked.
            if (this.player.volume == 0) {
                return Promise.reject(new VolumeMutedError());
            }
			*/
        }
        const playerOptions: AudioPlayerOptions = {
            audioFile: path,
            autoPlay: true,
            loop: false,
            completeCallback: (...args) => {
                console.log("audio-play:complete", path, args);
                doneCallback({ error: false });
            },
            errorCallback: (errorObject) => {
                console.log("audio-play:error", errorObject);
                doneCallback({ error: true });
            },
            infoCallback: (infoObject) => {
                console.log("audio-play:info", infoObject);
            },
        };

        return this.player.playFromFile(playerOptions).then(() => {
            console.log("audio:play:done");
        });
    }

    public async stopPlayer(): Promise<void> {
        await this.player.pause();
        await this.player.dispose();
    }

    public async pausePlayer(): Promise<void> {
        await this.player.pause();
    }

    public getDuration(): Promise<string> {
        return this.player.getAudioTrackDuration();
    }

    public async deleteRecordedFile(name: string): Promise<string> {
        console.log("audio:remove", name);
        await this.folder.getFile(name + this.extension).remove();
        return name;
    }
}
