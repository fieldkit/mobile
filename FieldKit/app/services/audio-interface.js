import {
    AudioPlayerOptions,
    AudioRecorderOptions,
    TNSPlayer,
    TNSRecorder
} from "nativescript-audio";
import { Folder, File, path, knownFolders } from "tns-core-modules/file-system";
import * as platform from "tns-core-modules/platform";
import DatabaseInterface from "./db-interface";
const dbInterface = new DatabaseInterface();

const player = new TNSPlayer();
const recorder = new TNSRecorder();
const documents = knownFolders.documents();
const folder = documents.getFolder("FieldKitAudio");

export default class AudioInterface {
    constructor() {
        this.extension = platform.isAndroid ? ".m4a" : ".caf";
    }

    async startAudioRecording(filename) {
        if (!TNSRecorder.CAN_RECORD()) {
            dialogs.alert("This device cannot record audio.");
            return;
        }

        let androidFormat;
        let androidEncoder;
        if (platform.isAndroid) {
            // static constants are not available, using raw values here
            // androidFormat = android.media.MediaRecorder.OutputFormat.MPEG_4;
            androidFormat = 2;
            // androidEncoder = android.media.MediaRecorder.AudioEncoder.AAC;
            androidEncoder = 3;
        }

        const recorderOptions = {
            filename: path.join(folder.path, filename + this.extension),
            format: androidFormat,
            encoder: androidEncoder,
            infoCallback: infoObject => {
                // console.log(JSON.stringify(infoObject));
            },
            errorCallback: errorObject => {
                // console.log(JSON.stringify(errorObject));
            }
        };

        await recorder.start(recorderOptions);
    }

    stopAudioRecording() {
        recorder.stop().then(() => {
            // console.log("stopped recording");
        });
    }

    playRecordedFile(filename) {
        const playerOptions = {
            audioFile: path.join(folder.path, filename + this.extension),
            loop: false,
            completeCallback: async () => {
                if (!playerOptions.loop) {
                    await player.dispose();
                }
            },
            errorCallback: errorObject => {
                // console.log(JSON.stringify(errorObject));
            },
            infoCallback: infoObject => {
                // console.log(JSON.stringify(infoObject));
            }
        };

        player
            .playFromFile(playerOptions)
            .then(() => {
                // console.log('playing', filename);
            })
            .catch(e => {
                // console.log('error playing', e);
            });
    }

    deleteRecordedFile(filename) {
        const toDelete = folder.getFile(filename + this.extension);
        toDelete
            .remove()
            .then(res => {
                // console.log("File successfully deleted");
            })
            .catch(err => {
                // console.log(err.stack);
            });
    }
}
