import { isAndroid, path, knownFolders } from "@nativescript/core";
import { AudioPlayerOptions, AudioRecorderOptions, TNSPlayer, TNSRecorder } from "nativescript-audio";
import { getPathTimestamp } from "@/utilities";

export class NoRecordingAllowedError extends Error {
    constructor() {
        super("recording disabled");
    }
}

export default class AudioInterface {
    player: any;
    recorder: any;
    folder: any;
    extension: string;
    options: any;

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

    startAudioRecording() {
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

    pauseAudioRecording() {
        return this.recorder.pause();
    }

    resumeAudioRecording() {
        return this.recorder.resume();
    }

    stopAudioRecording() {
        return this.recorder.stop();
    }

    playRecordedFile(filename) {
        const playerOptions: AudioPlayerOptions = {
            audioFile: filename,
            loop: false,
            completeCallback: async (...args) => {
                console.log("audio: complete", filename, args);
                if (!playerOptions.loop) {
                    await this.player.dispose();
                }
            },
            errorCallback: (errorObject) => {
                console.log("audio: error", errorObject);
            },
            infoCallback: (infoObject) => {
                console.log("audio: info", infoObject);
            },
        };

        return this.player.playFromFile(playerOptions);
    }

    pausePlayer() {
        return this.player.pause();
    }

    getDuration() {
        return this.player.getAudioTrackDuration;
    }

    deleteRecordedFile(filename) {
        return this.folder.getFile(filename + this.extension).remove();
    }
}
