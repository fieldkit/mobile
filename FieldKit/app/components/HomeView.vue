<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <Label
                v-if="loggedIn"
                class="plain m-20 text-center"
                :text="message"
                textWrap="true"
            ></Label>
            <Button
                class="btn btn-primary btn-padded"
                :text="_L('viewStations')"
                @tap="viewStations"
            ></Button>
            <StackLayout class="spacer m-t-30"></StackLayout>
            <Label
                text="temporary buttons"
                class="size-14 text-center m-t-20 m-b-20"
            />
            <Button
                class="btn btn-primary btn-padded"
                text="Save Diagnostics"
                @tap="saveDiagnostics"
            ></Button>
            <Button
                class="btn btn-primary btn-padded"
                text="Upload Diagnostics"
                @tap="uploadDiagnostics"
            ></Button>
            <Button
                class="btn btn-primary btn-padded"
                text="Copy Logs"
                @tap="copyLogs"
            ></Button>
            <Button
                class="btn btn-primary btn-padded"
                text="Delete DB"
                @tap="deleteDB"
            ></Button>
            <Button
                class="btn btn-primary btn-padded"
                text="Delete app copies of station data"
                @tap="deleteFiles"
            ></Button>
            <StackLayout class="m-t-20">
                <Button
                    class="btn btn-primary btn-padded"
                    text="Start QR code scanning"
                    @tap="doScanWithBackCamera">
                </Button>
            </StackLayout>
        </StackLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import { sendLogs } from "../lib/logging";
import Services from "../services/services";
import { knownFolders } from "tns-core-modules/file-system";
import { BarcodeScanner } from "nativescript-barcodescanner";

export default {
    data() {
        return {
            message: _L("authenticated"),
            loggedIn: this.$portalInterface.isLoggedIn()
        };
    },
    components: {
        BarcodeScanner
    },
    methods: {
        onPageLoaded() {},
        viewStations() {
            this.$navigateTo(routes.stations);
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
            const dataFolder = knownFolders
                .currentApp()
                .getFolder("FieldKitData");

            dataFolder
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
</style>
