<template>
<Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
    <DockLayout height="100%" stretchLastChild="true">
        <Label class="h2 m-y-20 text-center" :text="message" textWrap="true" dock="top"></Label>

        <SynchronizePanel dock="top" :station="station" />

        <!--

        Saved for posterity.

        <GridLayout columns="26*,48*,26*" rows="auto, auto">
            <BarcodeScanner
                row="0"
                colSpan="3"
                height="300"
                formats="QR_CODE, EAN_13, UPC_A"
                beepOnScan="true"
                reportDuplicates="true"
                preferFrontCamera="false"
                @scanResult="onScanResult"
                v-if="isIOS">
            </BarcodeScanner>
            <Button row="1"
                    col="1"
                    class="btn btn-primary"
                    text="Start scanning"
                    @tap="doScanWithBackCamera"></Button>

            !-- <Button row="3" class="btn btn-primary btn-rounded-sm" text="front camera, no flip" @tap="doScanWithFrontCamera"></Button> --
        </GridLayout>
        -->

        <StackLayout dock="bottom" verticalAlignment="bottom">
            <StationFooterTabs :station="station" />
        </StackLayout>
    </DockLayout>
</Page>
</template>

<script>
import { isIOS } from "tns-core-modules/platform";
import { BarcodeScanner } from "nativescript-barcodescanner";
import { Label } from "tns-core-modules/ui/label/label";
import routes from "../routes";

import SynchronizePanel from './SynchronizePanel';
import StationFooterTabs from './StationFooterTabs';

export default {
    data() {
        return {
            message: this.stationName,
        };
    },
    computed: {
        station: function() {
            return {
                id: this.stationId,
                name: this.stationName,
                url: this.url,
            };
        }
    },
    components: {
        SynchronizePanel,
        StationFooterTabs,
    },
    props: ['stationId', 'url', 'stationName'],
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
        },

        goToStation(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {event.object.className = cn;}, 500);

            this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: this.stationId
                }
            });
        },

        scan(front) {
            new BarcodeScanner().scan({
                cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
                cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
                message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
                preferFrontCamera: front,     // Android only, default false
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

        onScanResult(evt) {
            // Note: this does not ever seem to get called... ?
            // console.log(`onScanResult: ${evt.text} (${evt.format})`);
        },

        doScanWithBackCamera() {
            this.scan(false);
        },

        doScanWithFrontCamera() {
            this.scan(true);
        },
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import '../app-variables';
// End custom common variables

// Custom styles
#download-container {
    height: 200;
}

.progress-bar-container {
    width: 75%;
    margin-top: 20;
    margin-bottom: 20;
    margin-left: 10;
    margin-right: 10;
}

.progress-bar {
    height: 8;
    background: $fk-gray-lightest;
    border-radius: 4;
}

#download-progress-bar {
    background: $fk-secondary-blue;
}
</style>
