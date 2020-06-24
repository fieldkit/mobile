<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <Scrollview>
            <FlexboxLayout flexDirection="column" class="p-t-10">
                <Label v-if="loggedIn" class="plain m-20 text-center" :text="message" textWrap="true"></Label>
                <Button class="btn btn-primary btn-padded" :text="_L('viewStations')" @tap="viewStations"></Button>
                <StackLayout class="spacer m-t-30"></StackLayout>
                <StackLayout class="m-x-20 m-b-20">
                    <Label class="m-y-10" textWrap="true" :text="_L('currentEnvironment') + ': ' + environmentLabels[currentEnv]" />
                    <GridLayout rows="auto" columns="200" horizontalAlignment="center">
                        <DropDown
                            row="0"
                            col="0"
                            class="p-l-5 p-b-2 size-18 drop-down"
                            :items="environmentLabels"
                            :selectedIndex="currentEnv"
                            id="env-drop-down"
                            @opened="onOpened"
                            @selectedIndexChanged="onDropDownSelection"
                        ></DropDown>
                        <Image
                            row="0"
                            col="0"
                            width="15"
                            class="m-r-5"
                            horizontalAlignment="right"
                            verticalAlignment="middle"
                            src="~/images/Icon_Cheveron_Down.png"
                            @tap="openDropDown"
                        />
                    </GridLayout>
                </StackLayout>
                <Button class="btn btn-primary btn-padded" :text="_L('resetCalibration')" @tap="resetCalibration"></Button>
                <Button class="btn btn-primary btn-padded" :text="_L('resetOnboarding')" @tap="resetOnboarding"></Button>
                <Button class="btn btn-primary btn-padded" :text="_L('uploadDiagnostics')" @tap="uploadDiagnostics"></Button>
                <Button class="btn btn-primary btn-padded" :text="_L('deleteDB')" @tap="deleteDB"></Button>
                <Button class="btn btn-primary btn-padded" :text="_L('deleteFiles')" @tap="deleteFiles"></Button>
                <Button class="btn btn-primary btn-padded" :text="_L('crash')" @tap="crash"></Button>
                <Button class="btn btn-primary btn-padded" :text="_L('manualCrash')" @tap="manualCrash"></Button>
            </FlexboxLayout>
        </Scrollview>
    </Page>
</template>

<script>
import { crashlytics } from "nativescript-plugin-firebase";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { knownFolders } from "tns-core-modules/file-system";
import { BarcodeScanner } from "nativescript-barcodescanner";
import { sendLogs } from "../lib/logging";
import { listAllFiles } from "../lib/fs";
import Config from "../config";
import routes from "../routes";
import Services from "../services/services";
import Recalibrate from "./onboarding/Recalibrate";
import AppSettings from "../wrappers/app-settings";
import DiagnosticsModal from "./DiagnosticsModal";
import StationPicker from "./StationPickerModal";

export default {
    data() {
        return {
            message: _L("devOptions"),
            loggedIn: this.$portalInterface.isLoggedIn(),
            currentEnv: 0,
            environments: [
                {
                    uri: "https://api.fkdev.org",
                    label: "Development",
                },
                {
                    uri: "https://api.fieldkit.org",
                    label: "Production",
                },
            ],
            environmentLabels: [],
            stations: [],
        };
    },
    components: {
        BarcodeScanner,
        Recalibrate,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            this.$stationMonitor.subscribeAll(this.updateStations.bind(this));

            Services.Database()
                .getConfig()
                .then(result => {
                    if (result.length == 0) {
                        console.log("DeveloperMenuView did not get config from db. Using config.js", Config);
                        this.config = Config;
                    } else {
                        this.config = result[0];
                    }
                    const baseUri = this.config.baseUri;
                    this.currentEnv = this.environments.findIndex(env => {
                        return env.uri == baseUri;
                    });
                    if (this.currentEnv == -1) {
                        this.environments.push({
                            uri: baseUri,
                            label: "Local",
                        });
                        this.currentEnv = this.environments.length - 1;
                    }
                    this.environmentLabels = this.environments.map(env => {
                        return env.label;
                    });
                });
        },
        updateStations(stations) {
            this.stations = stations;
        },
        viewStations() {
            this.$navigateTo(routes.stations);
        },
        openDropDown(event) {
            const dropDown = this.page.getViewById("env-drop-down");
            dropDown.open();
        },
        onOpened(event) {
            // provide feedback by changing background color
            event.object.backgroundColor = "#F4F5F7";
            setTimeout(() => {
                event.object.backgroundColor = "white";
            }, 500);
        },
        onDropDownSelection(event) {
            this.currentEnv = event.newIndex;
            const baseUri = this.environments[this.currentEnv].uri;
            const params = {
                baseUri: baseUri,
                ingestionUri: baseUri + "/ingestion",
                id: this.config.id,
            };
            Services.Database().updateConfigUris(params);
        },
        resetCalibration() {
            if (this.stations.length == 0) {
                alert({
                    title: _L("resetCalibration"),
                    message: _L("noStationsFound"),
                    okButtonText: _L("ok"),
                });
            } else {
                const options = {
                    props: {
                        stations: this.stations,
                    },
                    fullscreen: true,
                };
                this.$showModal(StationPicker, options).then(station => {
                    if (station) {
                        this.$navigateTo(Recalibrate, {
                            props: {
                                stepParam: "startCalibration",
                                stationParam: station,
                            },
                        });
                    }
                });
            }
        },
        resetOnboarding() {
            const appSettings = new AppSettings();
            appSettings.remove("completedSetup");
            appSettings.remove("skipCount");
            dialogs
                .confirm({
                    title: _L("resetDoneGoToOnboarding"),
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("no"),
                })
                .then(result => {
                    if (result) {
                        // navigate to onboarding
                        this.$navigateTo(routes.assembleStation);
                    }
                });
        },
        uploadDiagnostics() {
            this.$showModal(DiagnosticsModal, {
                props: {},
            });
        },
        deleteDB() {
            Services.CreateDb()
                .initialize(true)
                .then(result => {
                    this.$stationMonitor.clearStations();

                    alert({
                        title: _L("devOptions"),
                        message: _L("dbDeleted"),
                        okButtonText: _L("ok"),
                    });
                });
        },
        deleteFiles() {
            const rootFolder = knownFolders.documents();
            const diagnosticsFolder = rootFolder.getFolder("diagnostics");
            const firmwareFolder = rootFolder.getFolder("firmware");
            const dataFolder = rootFolder.getFolder("FieldKitData");

            return Promise.all([firmwareFolder.clear(), diagnosticsFolder.clear(), dataFolder.clear()])
                .catch(res => {
                    console.log("error removing files", err.stack, res);

                    alert({
                        title: _L("devOptions"),
                        message: _L("errorRemovingFiles"),
                        okButtonText: _L("ok"),
                    });
                })
                .then(res => {
                    return listAllFiles(rootFolder);
                })
                .then(after => {
                    console.log(
                        "files deleted",
                        _(after)
                            .map(f => f.path)
                            .value()
                    );

                    alert({
                        title: _L("devOptions"),
                        message: _L("filesRemoved"),
                        okButtonText: _L("ok"),
                    });
                });
        },
        scan(front) {
            new BarcodeScanner()
                .scan({
                    cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
                    cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
                    showFlipCameraButton: true, // default false
                    showTorchButton: true, // iOS only, default false
                    torchOn: false, // launch with the flashlight on (default false)
                    resultDisplayDuration: 500, // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
                    beepOnScan: true, // Play or Suppress beep on scan (default true)
                    openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
                    closeCallback: () => {
                        // console.log("Scanner closed @ " + new Date().getTime());
                    },
                })
                .then(
                    result => {
                        // console.log("--- scanned: " + result.text);
                        // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
                        setTimeout(() => {
                            alert({
                                title: "Scan result",
                                message: "Format: " + result.format + ",\nValue: " + result.text,
                                okButtonText: "OK",
                            });
                        }, 200);
                    },
                    errorMessage => {
                        // console.log("No scan. " + errorMessage);
                    }
                );
        },

        crash() {
            crashlytics.crash();
        },

        manualCrash() {
            crashlytics.sendCrashLog(new java.lang.Exception("Oh, no! Manual crash!"));
        },

        doScanWithBackCamera() {
            this.scan(false);
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.spacer {
    border-top-color: $fk-gray-border;
    border-top-width: 2;
}
.drop-down {
    padding: 8;
    background-color: white;
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
}
</style>
