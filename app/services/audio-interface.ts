import { isAndroid, path, knownFolders } from "@nativescript/core";
import { AudioPlayerOptions, AudioRecorderOptions, TNSPlayer, TNSRecorder } from "nativescript-audio";
import { getPathTimestamp } from "@/utilities";

export class NoRecordingAllowedError extends Error {
    constructor() {
        super("recording disabled");
    }
}

export default class AudioInterface {
    private readonly player: TNSPlayer;
    private readonly recorder: TNSRecorder;
    private readonly folder: any;
    private readonly extension: string;
    private readonly options: any;

    constructor(services) {
        this.player = new TNSPlayer();
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

    public pauseAudioRecording(): Promise<any> {
        return this.recorder.pause();
    }

    public resumeAudioRecording(): Promise<any> {
        return this.recorder.resume();
    }

    public stopAudioRecording(): Promise<any> {
        return this.recorder.stop();
    }

    public isPlaying(): boolean {
        return this.player.isAudioPlaying();
    }

    public playRecordedFile(path: string, doneCallback: () => void): Promise<any> {
        console.log("audio:play", path);
        const playerOptions: AudioPlayerOptions = {
            audioFile: path,
            loop: false,
            completeCallback: async (...args) => {
                console.log("audio-play:complete", path, args);
                if (!playerOptions.loop) {
                    await this.player.dispose();
                }
                doneCallback();
            },
            errorCallback: (errorObject) => {
                console.log("audio-play:error", errorObject);
            },
            infoCallback: (infoObject) => {
                console.log("audio-play:info", infoObject);
            },
        };

        return this.player.playFromFile(playerOptions);
    }

    public stopPlayer(): Promise<any> {
        return this.player.pause().then(() => {
            return this.player.dispose();
        });
    }

    public pausePlayer(): Promise<any> {
        return this.player.pause();
    }

    public getDuration(): Promise<string> {
        return this.player.getAudioTrackDuration();
    }

    public deleteRecordedFile(name: string): Promise<string> {
        console.log("audio:remove", name);
        this.folder.getFile(name + this.extension).remove();
        return Promise.resolve(name);
    }
}
