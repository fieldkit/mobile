<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" @unloaded="onPageUnloaded">
        <GridLayout rows="*,55">
            <ScrollView row="0">
                <GridLayout rows="60,*" automationText="dataSyncLayout">
                    <ScreenHeader row="0" class="p-t-10" :title="_L('dataSync')" :canNavigateBack="false" :canNavigateSettings="false" />
                    <StackLayout row="1" class="sync-panel-container">
                        <StackLayout v-for="sync in syncs" :key="sync.deviceId" class="station-container">
                            <GridLayout rows="auto" columns="70*, 30*">
                                <StackLayout row="0" col="0">
                                    <Label :text="sync.name" textWrap="true" class="station-name"></Label>
                                    <Label
                                        v-if="sync.location"
                                        :text="'Location: ' + sync.location"
                                        textWrap="true"
                                        class="station-location"
                                    ></Label>
                                    <Label v-if="!sync.location" text="Unknown Location" class="station-location"></Label>
                                    <template v-if="!sync.connected">
                                        <StackLayout class="station-connection station-disconnected" orientation="horizontal">
                                            <Image width="20" src="~/images/Icon_not_Connected.png"></Image>
                                            <Label text="Not Connected" class="connected-label" />
                                            <Label :text="'Since ' + prettyDate(sync.lastSeen)" class="connected-since" />
                                        </StackLayout>
                                    </template>
                                    <template v-else>
                                        <StackLayout class="station-connection station-connected" orientation="horizontal">
                                            <Image width="20" src="~/images/Icon_Connected.png"></Image>
                                            <Label text="Station Connected" class="connected-label" />
                                        </StackLayout>
                                    </template>
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon">
                                    <Image
                                        width="25"
                                        src="~/images/Icon_Cheveron_Up.png"
                                        @tap="onToggle(sync)"
                                        v-show="opened(sync)"
                                    ></Image>
                                    <Image
                                        width="25"
                                        src="~/images/Icon_Cheveron_Down.png"
                                        @tap="onToggle(sync)"
                                        v-show="!opened(sync)"
                                    ></Image>
                                </StackLayout>
                            </GridLayout>

                            <GridLayout
                                rows="auto"
                                columns="70*, 30*"
                                class="transfer-container"
                                v-if="opened(sync) && sync.isDownloadReady"
                            >
                                <StackLayout row="0" col="0" class="transfer-details transfer-ready">
                                    <Label :text="sync.readingsReady + ' Readings'" class="readings-label" v-if="sync.readingsReady > 1" />
                                    <Label :text="sync.readingsReady + ' Reading'" class="readings-label" v-if="sync.readingsReady == 1" />
                                    <Label text="Ready to download from station" class="transfer-label" />
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon" v-if="sync.connected">
                                    <Image width="20" src="~/images/Icon_Download.png" @tap="onDownload(sync)"></Image>
                                </StackLayout>
                            </GridLayout>

                            <GridLayout rows="auto" columns="70*, 30*" class="transfer-container" v-if="opened(sync) && sync.isDownloaded">
                                <StackLayout row="0" col="0" class="transfer-details transfer-ready">
                                    <Label
                                        :text="sync.readingsDownloaded + ' Readings'"
                                        class="readings-label"
                                        v-if="sync.readingsDownloaded > 1"
                                    />
                                    <Label
                                        :text="sync.readingsDownloaded + ' Reading'"
                                        class="readings-label"
                                        v-if="sync.readingsDownloaded == 1"
                                    />
                                    <Label text="Downloaded" class="transfer-label" />
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon">
                                    <Image width="20" src="~/images/Icon_Save.png"></Image>
                                </StackLayout>
                            </GridLayout>

                            <GridLayout rows="auto" columns="70*, 30*" class="transfer-container" v-if="opened(sync) && sync.isCopying">
                                <StackLayout row="0" col="0" class="transfer-pending transfer-busy">
                                    <Label :text="sync.readingsReady + ' Readings'" class="readings-label" v-if="sync.readingsReady > 1" />
                                    <Label :text="sync.readingsReady + ' Reading'" class="readings-label" v-if="sync.readingsReady == 1" />
                                    <Label text="Downloading" class="transfer-label" v-if="sync.isDownloading" />
                                    <Label text="Uploading" class="transfer-label" v-if="sync.isUploading" />
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon" orientation="horizontal">
                                    <Label :text="sync.progress.percentage" class="transfer-progress" v-if="sync.progress" />
                                    <Image width="20" src="~/images/Icon_Syncing.png"></Image>
                                </StackLayout>
                            </GridLayout>

                            <GridLayout rows="auto" columns="70*, 30*" class="transfer-container" v-if="opened(sync) && sync.isUploadReady">
                                <StackLayout row="0" col="0" class="transfer-details transfer-ready">
                                    <Label :text="sync.readingsReady + ' Readings'" class="readings-label" v-if="sync.readingsReady > 1" />
                                    <Label :text="sync.readingsReady + ' Reading'" class="readings-label" v-if="sync.readingsReady == 1" />
                                    <Label text="Ready to upload" class="transfer-label" />
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon">
                                    <Image width="20" src="~/images/Icon_Download.png" @tap="onUpload(sync)"></Image>
                                </StackLayout>
                            </GridLayout>

                            <GridLayout rows="auto" columns="70*, 30*" class="transfer-container" v-if="opened(sync) && sync.isComplete">
                                <StackLayout row="0" col="0" class="transfer-pending transfer-waiting">
                                    <Label
                                        :text="sync.readingsUploaded + ' Readings'"
                                        class="readings-label"
                                        v-if="sync.readingsUploaded > 1"
                                    />
                                    <Label
                                        :text="sync.readingsUploaded + ' Reading'"
                                        class="readings-label"
                                        v-if="sync.readingsUploaded == 1"
                                    />
                                    <Label text="Synced" class="transfer-label" />
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon">
                                    <Image width="20" src="~/images/Icon_Success.png"></Image>
                                </StackLayout>
                            </GridLayout>

                            <GridLayout rows="auto" columns="70*, 30*" class="transfer-container" v-if="opened(sync) && sync.hasError">
                                <StackLayout row="0" col="0" class="transfer-pending transfer-waiting">
                                    <Label
                                        text="You are logged out. Please open settings and Log In."
                                        class="error-label"
                                        v-if="sync.isAuthenticationError"
                                    />
                                    <Label text="An error occurred! Oh no!" class="error-label" v-if="sync.isOtherError" />
                                </StackLayout>
                            </GridLayout>
                        </StackLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>
            <ScreenFooter row="1" active="data" />
        </GridLayout>
    </Page>
</template>

<script>
import _ from "lodash";
import Vue from "../wrappers/vue";
import * as ActionTypes from "../store/actions";
import moment from "moment";
import Services from "../services/services";
import Config from "../config";
import routes from "../routes";
import ScreenFooter from "./ScreenFooter";
import ScreenHeader from "./ScreenHeader";

const log = Config.logger("DataSyncView");

export default {
    data() {
        return {
            closed: {},
        };
    },
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    computed: {
        syncs() {
            return this.$store.getters.syncs;
        },
    },
    methods: {
        onPageLoaded(args) {},
        onPageUnloaded(args) {},
        onToggle(sync) {
            Vue.set(this.closed, sync.deviceId, this.opened(sync));
            log.info("toggle", sync.name, this.closed[sync.deviceId]);
        },
        onDownload(sync) {
            log.info("download", sync);
            return this.$store.dispatch(ActionTypes.DOWNLOAD_STATION, sync);
        },
        onUpload(sync) {
            log.info("upload", sync);
            return this.$store.dispatch(ActionTypes.UPLOAD_STATION, sync);
        },
        opened(sync) {
            if (this.closed[sync.deviceId] === true) {
                return false;
            }
            if (this.closed[sync.deviceId] === false) {
                return true;
            }
            return sync.connected;
        },
        prettyDate(date) {
            if (!date) {
                return "N/A";
            }
            return moment(date).format("MM/DD/YYYY");
        },
    },
};
</script>

<style scoped lang="scss">
@import "../app-variables";

.station-container {
    margin: 15;
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 4;
    padding: 10;
}
.transfer-container {
    margin-top: 10;
    padding-top: 15;
    padding-bottom: 10;
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}
.connected-since {
    padding-left: 5;
    font-size: 10;
    color: $fk-gray-text;
    vertical-align: center;
}
.transfer-details {
}
.station-name {
    font-size: 18;
}
.station-location {
    font-size: 16;
    color: $fk-gray-text;
}
.station-connection {
    vertical-align: middle;
}
.station-connection .connected-label {
    vertical-align: middle;
    padding-left: 10;
    font-size: 12;
}
.station-connected {
}
.station-disconnected {
}
.container-icon {
    vertical-align: middle;
    /* background-color: #ffefaa; */
    horizontal-align: right;
    margin-right: 10;
}
.transfer-progress {
    vertical-align: middle;
    font-size: 14;
    color: $fk-gray-text;
    padding-right: 10;
}
.error-label {
}
</style>
