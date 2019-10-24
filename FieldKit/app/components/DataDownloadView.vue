<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,80">
            <ScrollView row="0">
                <FlexboxLayout
                    class="page p-t-10"
                    flexDirection="column"
                    justifyContent="space-between"
                >
                    <ScreenHeader
                        title="Data Sync"
                        :canNavigateBack="false"
                        :canNavigateSettings="false"
                    />
                    <SynchronizePanel :station="station" />
                    <StackLayout class="m-t-20">
                        <Button
                            class="btn btn-primary"
                            text="Start scanning"
                            @tap="doScanWithBackCamera">
                        </Button>
                    </StackLayout>
                </FlexboxLayout>
            </ScrollView>
            <StationFooterTabs row="1" :station="station" active="data" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import { BarcodeScanner } from "nativescript-barcodescanner";
import SynchronizePanel from "./SynchronizePanel";
import StationFooterTabs from "./StationFooterTabs";
import ScreenHeader from "./ScreenHeader";

export default {
    props: {
        station: Object
    },
    components: {
        ScreenHeader,
        BarcodeScanner,
        SynchronizePanel,
        StationFooterTabs
    },
    data() {
        return {};
    },
    methods: {
        onPageLoaded(args) {},

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
        },
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
</style>
