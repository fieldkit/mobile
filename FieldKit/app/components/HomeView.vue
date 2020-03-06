<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <Scrollview>
            <FlexboxLayout flexDirection="column" class="p-t-10">
                <Label v-if="loggedIn" class="plain m-20 text-center" :text="message" textWrap="true"></Label>
                <Button class="btn btn-primary btn-padded" :text="_L('viewStations')" @tap="viewStations"></Button>
                <StackLayout class="spacer m-t-30"></StackLayout>
                <StackLayout class="m-x-20 m-b-20">
                    <Label
                        class="m-y-10"
                        textWrap="true"
                        :text="'The current environment is: ' + environmentLabels[currentEnv]"
                    />
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
                <Button class="btn btn-primary btn-padded" text="Reset Calibration" @tap="resetCalibration"></Button>
                <Button class="btn btn-primary btn-padded" text="Reset Onboarding" @tap="resetOnboarding"></Button>
                <Button class="btn btn-primary btn-padded" text="Save Diagnostics" @tap="saveDiagnostics"></Button>
                <Button class="btn btn-primary btn-padded" text="Upload Diagnostics" @tap="uploadDiagnostics"></Button>
                <Button class="btn btn-primary btn-padded" text="Copy Logs" @tap="copyLogs"></Button>
                <Button class="btn btn-primary btn-padded" text="Delete DB" @tap="deleteDB"></Button>
                <Button class="btn btn-primary btn-padded" text="Delete Files" @tap="deleteFiles"></Button>
                <!-- <Button class="btn btn-primary btn-padded" text="Start QR Code Scanning" @tap="doScanWithBackCamera"></Button> -->
            </FlexboxLayout>
        </Scrollview>
    </Page>
</template>

<script>
import * as dialogs from "tns-core-modules/ui/dialogs";
import { knownFolders } from "tns-core-modules/file-system";
import { BarcodeScanner } from "nativescript-barcodescanner";
import { sendLogs } from "../lib/logging";
import routes from "../routes";
import Services from "../services/services";
import Recalibrate from "./onboarding/Recalibrate";
import modalStationPicker from "./ModalStationPicker";
import AppSettings from "../wrappers/app-settings";

const appSettings = new AppSettings();
const dbInterface = Services.Database();
const stateManager = Services.StateManager();

export default {
    data() {
        return {
            message: "Development Options",
            loggedIn: this.$portalInterface.isLoggedIn(),
            currentEnv: 0,
            environments: [
                {
                    uri: "https://api.fkdev.org",
                    label: "Development"
                },
                {
                    uri: "https://api.fieldkit.org",
                    label: "Production"
                }
            ],
            environmentLabels: [],
            stations: []
        };
    },
    components: {
        BarcodeScanner,
        Recalibrate
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            this.$stationMonitor.subscribeAll(this.updateStations.bind(this));

            dbInterface.getConfig().then(result => {
                this.config = result[0];
                const baseUri = this.config.baseUri;
                this.currentEnv = this.environments.findIndex(env => {
                    return env.uri == baseUri;
                });
                if (this.currentEnv == -1) {
                    this.environments.push({
                        uri: baseUri,
                        label: "Local"
                    });
                    this.currentEnv = this.environments.length - 1;
                }
                this.environmentLabels = this.environments.map(env => {
                    return env.label;
                });
            });
        },
        updateStations(data) {
            switch (data.propertyName.toString()) {
                case this.$stationMonitor.StationsUpdatedProperty: {
                    this.stations = data.value;
                    break;
                }
                case this.$stationMonitor.StationRefreshedProperty: {
                    break;
                }
            }
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
                id: this.config.id
            };
            dbInterface.updateConfigUris(params).then(() => {
                this.$portalInterface.refreshUri();
                stateManager.refreshIngestionUri();
            });
        },
        resetCalibration() {
            if (this.stations.length == 0) {
                alert({
                    title: "Reset Calibration",
                    message: "No stations found",
                    okButtonText: "OK"
                });
            } else {
                const options = {
                    props: {
                        stations: this.stations
                    },
                    fullscreen: true
                };
                this.$showModal(modalStationPicker, options).then(station => {
                    this.$navigateTo(Recalibrate, {
                        props: {
                            stepParam: "startCalibration",
                            stationParam: station
                        }
                    });
                });
            }
        },
        resetOnboarding() {
            appSettings.remove("completedSetup");
            dialogs
                .confirm({
                    title: "Reset complete! Would you like to go to Onboarding?",
                    okButtonText: _L("yes"),
                    cancelButtonText: "No"
                })
                .then(result => {
                    if (result) {
                        // navigate to onboarding
                        this.$navigateTo(routes.assembleStation);
                    }
                });
        },
        copyLogs() {
            sendLogs();
        },
        saveDiagnostics() {
            Services.Diagnostics().save().then(res => {
                alert({
                    title: "Diagnostics",
                    message: "Saved!",
                    okButtonText: "OK"
                });
            }, e => {
                console.log("error", e);
                alert({
                    title: "Diagnostics",
                    message: "Save Failed:\n" + e,
                    okButtonText: "OK"
                });
            });
        },
        uploadDiagnostics() {
            Services.Diagnostics().upload().then(res => {
                alert({
                    title: "Diagnostics",
                    message: "Uploaded! Thanks! Reference:\n" + res.reference,
                    okButtonText: "OK"
                });
            }, e => {
                console.log("error", e);
                alert({
                    title: "Diagnostics",
                    message: "Upload Failed:\n" + e,
                    okButtonText: "OK"
                });
            });
        },
        deleteDB() {
            Services.CreateDb().initialize(true).then(result => {
                this.$stationMonitor.clearStations();

                alert({
                    title: "Developer",
                    message: "Database Deleted",
                    okButtonText: "OK"
                });
            });
        },
        deleteFiles() {
            const firmwareFolder = knownFolders
                  .documents()
                  .getFolder("firmware");

            return firmwareFolder.remove().then(() => {
                const dataFolder = knownFolders
                      .currentApp()
                      .getFolder("FieldKitData");

                return dataFolder
                    .remove()
                    .then(() => {
                        console.log("Data folder successfully deleted");

                        alert({
                            title: "Developer",
                            message: "Files removed!",
                            okButtonText: "OK"
                        });
                    })
                    .catch(err => {
                        console.log("Error removing data folder", err.stack);

                        alert({
                            title: "Developer",
                            message: "Error removing files!",
                            okButtonText: "OK"
                        });
                    });
            });
        },
        scan(front) {
            new BarcodeScanner().scan({
                cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
                cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
                showFlipCameraButton: true,   // default false
                showTorchButton: true,        // iOS only, default false
                torchOn: false,               // launch with the flashlight on (default false)
                resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
                beepOnScan: true,             // Play or Suppress beep on scan (default true)
                openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
                closeCallback: () => {
                    // console.log("Scanner closed @ " + new Date().getTime());
                }
            }).then(result => {
                // console.log("--- scanned: " + result.text);
                // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
                setTimeout(() => {
                    alert({
                        title: "Scan result",
                        message: "Format: " + result.format + ",\nValue: " + result.text,
                        okButtonText: "OK"
                    });
                }, 200);
            }, errorMessage => {
                // console.log("No scan. " + errorMessage);
            });
        },

        doScanWithBackCamera() {
            this.scan(false);
        }
    }
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
