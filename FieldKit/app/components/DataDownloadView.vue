<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between">
                <Label class="h2 m-y-20 text-center" :text="message" textWrap="true"></Label>

                <StackLayout id="download-container">
                    <FlexboxLayout justifyContent="center">
                        <Button class="btn btn-primary" :text="_L('startDownload')" @tap="startDownload"></Button>
                    </FlexboxLayout>
                    <GridLayout v-show="isDownloading"
                        class="progress-bar-container"
                        rows="auto, auto, auto"
                        columns="*">
                        <StackLayout row="0" class="progress-bar"></StackLayout>
                        <StackLayout row="0"
                            class="progress-bar"
                            horizontalAlignment="left"
                            id="download-progress-bar"></StackLayout>
                        <Label row="1"
                            class="m-t-5 size-12"
                            horizontalAlignment="right"
                            :text="percentDownloaded"></Label>
                        <Label row="2"
                            class="m-t-5 size-12"
                            horizontalAlignment="right"
                            :text="sizeDownloaded+' MB'"></Label>
                    </GridLayout>
                    <FlexboxLayout justifyContent="center">
                        <Label :text="downloadComplete"></Label>
                    </FlexboxLayout>
                </StackLayout>

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
                    <!-- <Button row="3" class="btn btn-primary btn-rounded-sm" text="front camera, no flip" @tap="doScanWithFrontCamera"></Button> -->
                </GridLayout>

                <FlexboxLayout justifyContent="space-between" class="size-12 p-30 footer">
                    <StackLayout @tap="goToStation" class="footer-btn">
                        <Image width="20" src="~/images/Icon_Station_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('station')"></Label>
                    </StackLayout>
                    <StackLayout class="footer-btn">
                        <Image width="20" src="~/images/Icon_Data_Selected.png"></Image>
                        <Label class="bold m-t-2" :text="_L('data')"></Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Settings_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('settings')"></Label>
                    </StackLayout>
                </FlexboxLayout>

            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import {isIOS} from "tns-core-modules/platform";
    import {BarcodeScanner} from "nativescript-barcodescanner";
    import { Downloader } from 'nativescript-downloader';
    import { Label } from "tns-core-modules/ui/label/label";
    import { knownFolders } from "tns-core-modules/file-system";
    import routes from "../routes";

    const documents = knownFolders.documents();
    const folder = documents.getFolder("DataDownloads");

    export default {
        data() {
            return {
                message: this.stationName,
                isDownloading: false,
                percentDownloaded: 0,
                sizeDownloaded: 0,
                downloadComplete: ""
            };
        },
        props: ['stationId','url','stationName'],
        methods: {
            onPageLoaded(args) {
                this.page = args.object;
                Downloader.init();
                Downloader.setTimeout(120);
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

            startDownload() {
                this.isDownloading = true;
                // currently re-writing the file for each device every time
                let fileName = this.stationName+".bin";
                let downloader = new Downloader();
                let dataDownloader = downloader.createDownload({
                    url: this.url+"/download/0",
                    path: folder.path,
                    fileName: fileName
                });

                downloader
                    .start(dataDownloader, (progressData) => {
                        this.downloadComplete = "";
                        // progressData has value, currentSize, totalSize, speed
                        // convert to megabytes
                        this.sizeDownloaded = (progressData.currentSize / 1048576.0).toFixed(2);
                        this.percentDownloaded = progressData.value+"%";
                        this.page.addCss("#download-progress-bar {width: "+progressData.value+"%;}");
                    })
                    .then((completed) => {
                        // console.log(`File : ${completed.path}`);
                        this.downloadComplete = this.sizeDownloaded + ' ' + _L('mbDownloaded');
                        this.isDownloading = false;
                        this.percentDownloaded = 0;
                        this.sizeDownloaded = 0;
                        this.page.addCss("#download-progress-bar {width: 0;}");
                    })
                    .catch(error => {
                        console.log(error.message);
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
                    }
                );
            }

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
