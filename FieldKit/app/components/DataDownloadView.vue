<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between">
                <Label class="h2 m-y-20 text-center" :text="message" textWrap="true"></Label>

                <StackLayout id="download-container">
                    <FlexboxLayout justifyContent="center">
                        <Button class="btn btn-primary" text="Start download" @tap="startDownload"></Button>
                    </FlexboxLayout>
                    <GridLayout v-show="isDownloading" class="progress-bar-container" rows="auto, auto, auto" columns="*">
                        <StackLayout row="0" class="progress-bar"></StackLayout>
                        <StackLayout row="0" class="progress-bar" horizontalAlignment="left" id="download-progress-bar"></StackLayout>
                        <Label row="1" class="m-t-5 size-12" horizontalAlignment="right" :text="percentDownloaded"></Label>
                        <Label row="2" class="m-t-5 size-12" horizontalAlignment="right" :text="sizeDownloaded+' MB'"></Label>
                    </GridLayout>
                    <FlexboxLayout justifyContent="center">
                        <Label :text="downloadComplete"></Label>
                    </FlexboxLayout>
                </StackLayout>

                <FlexboxLayout justifyContent="space-between" class="size-12 p-30 footer">
                    <StackLayout @tap="goToStation">
                        <Image width="20" src="~/images/Icon_Station_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('station')"></Label>
                    </StackLayout>
                    <StackLayout>
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
    import { Label } from "tns-core-modules/ui/label/label";
    import { knownFolders } from "tns-core-modules/file-system";
    import { DownloadProgress } from "nativescript-download-progress"
    import routes from "../routes";

    const documents = knownFolders.documents();
    const folder = documents.getFolder("DataDownloads");
    // temp, size of download
    const size = 1024 * 1;

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
            },

            goToStation() {
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId
                    }
                });
            },

            startDownload() {
                let download = new DownloadProgress();
                this.before = Date.now();
                this.isDownloading = true;
                // currently re-writing the file for each device every time
                let dataFile = folder.getFile(this.stationName+".bin");

                download.addProgressCallback(progress => {
                    this.downloadComplete = "";
                    let percent = Math.round(progress * 100);
                    this.sizeDownloaded = ((progress * size) / 1024.0).toFixed(1);
                    this.percentDownloaded = percent+"%";
                    this.page.addCss("#download-progress-bar {width: "+percent+"%;}");
                });
                download.downloadFile(this.url+"/download?size="+size, null, dataFile.path).then(f => {
                    // console.log("Success: ", f);
                    let elapsed = Date.now() - this.before;
                    this.downloadComplete = this.sizeDownloaded + " MB downloaded.";
                    this.isDownloading = false;
                    this.percentDownloaded = 0;
                    this.sizeDownloaded = 0;
                    this.page.addCss("#download-progress-bar {width: 0;}");
                }).catch(e => {
                    // console.log("Error", e);
                });
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
