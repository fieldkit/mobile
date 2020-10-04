<template>
    <Page @loaded="onPageLoaded" @unloaded="onPageUnloaded">
        <PlatformHeader row="0" :title="_L('dataSync')" :canNavigateBack="false" :canNavigateSettings="false" />

        <GridLayout rows="*,55">
            <NoStationsWannaAdd row="0" v-if="syncs.length == 0" :image="true" />
            <ScrollView row="0" v-if="syncs.length > 0">
                <StackLayout class="sync-panel-container">
                    <StackLayout v-for="sync in syncs" :key="sync.deviceId" class="station-container">
                        <GridLayout rows="auto" columns="*,30">
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

                            <FlexboxLayout
                                row="0"
                                col="1"
                                class="container-icon"
                                @tap="onToggle(sync)"
                                flexDirection="column"
                                justifyContent="space-around"
                                alignItems="center"
                            >
                                <Image class="icon-button" width="25" src="~/images/Icon_Cheveron_Up.png" v-show="opened(sync)" />
                                <Image class="icon-button" width="25" src="~/images/Icon_Cheveron_Down.png" v-show="!opened(sync)" />
                            </FlexboxLayout>
                        </GridLayout>

                        <GridLayout rows="auto" columns="*,30" class="transfer-container" v-if="opened(sync) && sync.isDownloadReady">
                            <StackLayout row="0" col="0" class="transfer-details transfer-ready">
                                <Label
                                    :text="sync.readingsReadyDownload + ' Readings'"
                                    class="readings-label"
                                    v-if="sync.readingsReadyDownload > 1"
                                />
                                <Label
                                    :text="sync.readingsReadyDownload + ' Reading'"
                                    class="readings-label"
                                    v-if="sync.readingsReadyDownload == 1"
                                />
                                <Label text="Ready to download from station" class="transfer-label" />
                            </StackLayout>
                            <StackLayout row="0" col="1" class="container-icon" v-if="sync.connected">
                                <Image class="icon-button" width="20" src="~/images/Icon_Download.png" @tap="onDownload(sync)" />
                            </StackLayout>
                        </GridLayout>

                        <GridLayout rows="auto" columns="*,30" class="transfer-container" v-if="opened(sync) && sync.isDownloaded">
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
                                <Image class="icon-button" width="20" src="~/images/Icon_Save.png" />
                            </StackLayout>
                        </GridLayout>

                        <GridLayout rows="auto" columns="*,auto,30" class="transfer-container" v-if="opened(sync) && sync.isCopying">
                            <StackLayout row="0" col="0" class="transfer-pending transfer-busy">
                                <Label :text="sync.readingsCopying + ' Readings'" class="readings-label" v-if="sync.readingsCopying > 1" />
                                <Label :text="sync.readingsCopying + ' Reading'" class="readings-label" v-if="sync.readingsCopying == 1" />
                                <Label text="Downloading" class="transfer-label" v-if="sync.isDownloading" />
                                <Label text="Uploading" class="transfer-label" v-if="sync.isUploading" />
                            </StackLayout>
                            <StackLayout row="0" col="1" class="container-icon" orientation="horizontal">
                                <Label :text="sync.progress.percentage" class="transfer-progress" v-if="sync.progress" />
                            </StackLayout>
                            <StackLayout row="0" col="2" class="container-icon" orientation="horizontal">
                                <Image class="icon-button" width="20" src="~/images/Icon_Syncing.png" />
                            </StackLayout>
                        </GridLayout>

                        <GridLayout rows="auto" columns="*,30" class="transfer-container" v-if="opened(sync) && sync.isUploadReady">
                            <StackLayout row="0" col="0" class="transfer-details transfer-ready">
                                <Label
                                    :text="sync.readingsReadyUpload + ' Readings'"
                                    class="readings-label"
                                    v-if="sync.readingsReadyUpload > 1"
                                />
                                <Label
                                    :text="sync.readingsReadyUpload + ' Reading'"
                                    class="readings-label"
                                    v-if="sync.readingsReadyUpload == 1"
                                />
                                <Label text="Ready to upload" class="transfer-label" />
                            </StackLayout>
                            <StackLayout row="0" col="1" class="container-icon">
                                <Image class="icon-button" width="20" src="~/images/Icon_Download.png" @tap="onUpload(sync)" />
                            </StackLayout>
                        </GridLayout>

                        <GridLayout rows="auto" columns="*,30" class="transfer-container" v-if="opened(sync) && sync.isComplete">
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
                                <Image class="icon-button" width="20" src="~/images/Icon_Success.png"></Image>
                            </StackLayout>
                        </GridLayout>

                        <GridLayout rows="auto" columns="*" class="transfer-container" v-if="opened(sync) && sync.hasError">
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
            </ScrollView>
            <ScreenFooter row="1" active="data" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import _ from "lodash";
import moment from "moment";

import Vue from "vue";
import * as ActionTypes from "@/store/actions";
import routes from "@/routes";
import Config from "@/config";

import SharedComponents from "@/components/shared";
import NoStationsWannaAdd from "./NoStationsWannaAdd.vue";

const log = Config.logger("DataSyncView");

export default Vue.extend({
    components: {
        ...SharedComponents,
        NoStationsWannaAdd,
    },
    data() {
        return {
            closed: {},
        };
    },
    computed: {
        syncs(this: any) {
            return this.$store.getters.syncs;
        },
    },
    methods: {
        onPageLoaded(args) {},
        onPageUnloaded(args) {},
        onToggle(this: any, sync) {
            Vue.set(this.closed, sync.deviceId, this.opened(sync));
            log.info("toggle", sync.name, this.closed[sync.deviceId]);
        },
        onDownload(this: any, sync) {
            log.info("download", sync);
            return this.$store.dispatch(ActionTypes.DOWNLOAD_STATION, sync);
        },
        onUpload(this: any, sync) {
            log.info("upload", sync);
            return this.$store.dispatch(ActionTypes.UPLOAD_STATION, sync);
        },
        opened(this: any, sync) {
            if (this.closed[sync.deviceId] === true) {
                return false;
            }
            if (this.closed[sync.deviceId] === false) {
                return true;
            }
            return sync.connected || !sync.isComplete;
        },
        prettyDate(this: any, date) {
            if (!date) {
                return "N/A";
            }
            return moment(date).format("MM/DD/YYYY");
        },
        goToAddStation(this: any) {
            return this.$navigateTo(routes.onboarding.start);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
    /* background-color: #ffefaa; */
}
.transfer-progress {
    vertical-align: middle;
    font-size: 14;
    color: $fk-gray-text;
    padding-right: 10;
}
.error-label {
}
.icon-button {
    /* background-color: #bfbfef; */
}
</style>
