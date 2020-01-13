<template>
    <Page
        class="page"
        actionBarHidden="true"
        @loaded="onLoaded"
        @unloaded="onUnloaded"
    >
        <GridLayout rows="*,55">
            <ScrollView row="0">
                <GridLayout rows="60,*" automationText="dataSyncLayout">
                    <ScreenHeader
                        row="0"
                        class="p-t-10"
                        title="Data Sync"
                        :canNavigateBack="false"
                        :canNavigateSettings="false"
                    />
                    <StackLayout row="1" class="sync-panel-container">
                        <StackLayout
                            v-for="s in recentSyncs"
                            :key="s.deviceId"
                            class="station-container"
                        >
                            <Label
                                :text="s.name"
                                textWrap="true"
                                class="station-name"
                            ></Label>
                            <GridLayout
                                rows="auto,auto,auto,auto"
                                columns="*"
                                class="m-l-10"
                            >
                                <Label
                                    row="0"
                                    class="history-label"
                                    v-if="s.totalDownloads"
                                    :text="s.totalDownloads"
                                />
                                <Label
                                    row="1"
                                    class="m-l-20"
                                    v-if="s.lastDownloadTime"
                                    :text="s.lastDownloadTime"
                                />
                                <Label
                                    row="2"
                                    class="history-label"
                                    v-if="s.totalUploads"
                                    :text="s.totalUploads"
                                />
                                <Label
                                    row="3"
                                    class="m-l-20"
                                    v-if="s.lastUploadTime"
                                    :text="s.lastUploadTime"
                                />
                            </GridLayout>
                            <template v-if="s.canDownload">
                                <GridLayout
                                    rows="*,*,*"
                                    columns="15*,70*,15*"
                                    class="m-t-20"
                                >
                                    <Image
                                        rowSpan="2"
                                        col="0"
                                        width="25"
                                        src="~/images/Icon_Datafile.png"
                                        verticalAlignment="top"
                                    ></Image>
                                    <Label
                                        row="0"
                                        col="1"
                                        :text="s.downloadReadingsLabel"
                                        textWrap="true"
                                        class="status"
                                    ></Label>
                                    <Label
                                        row="1"
                                        col="1"
                                        :text="_L('downloading')"
                                        textWrap="true"
                                    ></Label>
                                    <Image
                                        rowSpan="2"
                                        col="2"
                                        width="25"
                                        src="~/images/Icon_Download.png"
                                        v-if="!downloading[s.deviceId]"
                                        :dataDeviceId="s.deviceId"
                                        @tap="onDownloadTap"
                                    ></Image>
                                    <Image
                                        rowSpan="2"
                                        col="2"
                                        width="25"
                                        :src="downloadingIcon"
                                        v-if="downloading[s.deviceId]"
                                    ></Image>
                                    <StackLayout
                                        row="2"
                                        colSpan="3"
                                        class="bottom-border"
                                    ></StackLayout>
                                </GridLayout>
                            </template>
                            <template v-else-if="s.disconnected">
                                <StackLayout class="m-20">
                                    <Label
                                        :text="_L('notConnectedToStation')"
                                    />
                                </StackLayout>
                            </template>
                            <template v-else>
                                <StackLayout class="m-20">
                                    <Label :text="_L('checkingDownload')" />
                                </StackLayout>
                            </template>

                            <template v-if="s.canUpload">
                                <GridLayout
                                    rows="*,*,*"
                                    columns="15*,70*,15*"
                                    class="m-t-20"
                                >
                                    <Image
                                        rowSpan="2"
                                        col="0"
                                        width="25"
                                        src="~/images/Icon_Datafile.png"
                                        verticalAlignment="top"
                                    ></Image>
                                    <Label
                                        row="0"
                                        col="1"
                                        :text="s.uploadStatus"
                                        textWrap="true"
                                        class="status"
                                    ></Label>
                                    <Label
                                        row="1"
                                        col="1"
                                        :text="s.uploadProgressLabel"
                                        textWrap="true"
                                    ></Label>
                                    <Image
                                        rowSpan="2"
                                        col="2"
                                        width="25"
                                        src="~/images/Icon_Pending_Clock.png"
                                        v-if="s.uploadState == 'waiting'"
                                        :dataDeviceId="s.deviceId"
                                        @tap="onUploadTap"
                                    ></Image>
                                    <Image
                                        rowSpan="2"
                                        col="2"
                                        width="25"
                                        :src="uploadingIcon"
                                        v-if="s.uploadState == 'uploading'"
                                    ></Image>
                                    <Image
                                        rowSpan="2"
                                        col="2"
                                        width="25"
                                        src="~/images/Icon_Success.png"
                                        v-if="s.uploadState == 'success'"
                                    ></Image>
                                    <StackLayout
                                        row="2"
                                        colSpan="3"
                                        class="bottom-border"
                                    ></StackLayout>
                                </GridLayout>
                            </template>
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
import Services from "../services/services";
import Config from "../config";
import routes from "../routes";
import ScreenFooter from "./ScreenFooter";
import ScreenHeader from "./ScreenHeader";

import { convertBytesToLabel } from "../utilities";

const dbInterface = Services.Database();

const log = Config.logger("DataSyncView");

export default {
    data() {
        return {
            recentSyncs: [],
            downloadingIcon: "~/images/Icon_Syncing.png",
            uploadingIcon: "~/images/Icon_Syncing.png",
            downloading: {},
            uploading: {},
            uploadInProgress: false
        };
    },
    components: {
        ScreenHeader,
        ScreenFooter
    },
    methods: {
        onLoaded(args) {
            log.info("loaded");

            const stateManager = Services.StateManager();

            log.info("subscribed");

            this.stations = this.$stationMonitor.getStations();
            this.stations.forEach(s => {
                let recent = this.createRecent(s);
                this.updateHistory(recent);
            });

            stateManager.subscribe(status => {
                this.manageRecentSyncs(status);
            });

            Services.ProgressService().subscribe(data => {
                if (data.message && data.message == "Uploading") {
                    this.uploadInProgress = true;
                    this.handleUploadProgress(data);
                }
            });
        },

        onUnloaded(args) {
            // TODO: unsubscribe from stateManager and ProgressService updates
        },

        updateHistory(recent) {
            dbInterface
                .getMostRecentDownloadByDeviceId(recent.deviceId)
                .then(result => {
                    this.updateDownloadHistory(result, recent);
                });
        },

        updateDownloadHistory(result, recent) {
            if (result.length > 0) {
                const downloadRecord = result[0];
                if (downloadRecord.uploaded) {
                    recent.totalDownloads =
                        downloadRecord.lastBlock +
                        " total readings down & uploaded";
                    recent.lastDownloadTime =
                        "Last down/upload: " +
                        this.getFormattedDateTime(downloadRecord.uploaded);
                    recent.totalUploads = "";
                    recent.lastUploadTime = "";
                } else {
                    recent.totalDownloads =
                        downloadRecord.lastBlock + " total readings downloaded";
                    recent.lastDownloadTime =
                        "Last download: " +
                        this.getFormattedDateTime(downloadRecord.timestamp);

                    dbInterface
                        .getMostRecentUploadByDeviceId(recent.deviceId)
                        .then(uploadResult => {
                            this.updateUploadHistory(uploadResult, recent);
                        });
                }
            }
        },

        updateUploadHistory(uploadResult, recent) {
            if (uploadResult.length > 0) {
                const uploadRecord = uploadResult[0];
                recent.totalUploads =
                    uploadRecord.lastBlock + " total readings uploaded";
                recent.lastUploadTime =
                    "Last upload: " +
                    this.getFormattedDateTime(uploadRecord.uploaded);
            }
        },

        manageRecentSyncs(status) {
            // manage downloads
            status.station.stations.forEach(s => {
                const station = s;
                let recent = this.recentSyncs.find(r => {
                    return r.deviceId == station.station.deviceId;
                });
                if (recent) {
                    this.updateRecent(recent, station, status);
                } else {
                    recent = this.createRecent(station);
                }
                this.updateHistory(recent);
            });

            // manage uploads
            status.portal.forEach(u => {
                let recent = this.recentSyncs.find(r => {
                    return r.deviceId == u.deviceId;
                });
                if (!recent) {
                    recent = this.createRecent(u);
                }
                this.handleDeviceUpload(recent, u);
                this.updateHistory(recent);
            });

            // check for disconnected stations in recentSyncs
            const disconnected = _.differenceBy(
                this.recentSyncs,
                status.station.stations,
                s => {
                    return s.deviceId ? s.deviceId : s.station.deviceId;
                }
            );
            disconnected.forEach(d => {
                d.disconnected = true;
            });

            // the constant jumping around and switching places is
            // problematic here, so sort alphabetically
            this.recentSyncs = this.recentSyncs.sort((a, b) => {
                return b.name > a.name ? 1 : b.name < a.name ? -1 : 0;
            });
        },

        updateRecent(recent, station, status) {
            recent.disconnected = false;
            recent.readings = station.pending.records;
            recent.downloadReadingsLabel =
                recent.readings + " " + _L("readings");
            // need higher limit than 0, or get stuck in loop
            recent.canDownload = recent.readings > 3;

            if (Config.syncMode == "manual") {
                // in manual mode
                if (!recent.canDownload) {
                    delete this.downloading[recent.deviceId];
                    const inProgress = Object.keys(this.downloading);
                    if (inProgress.length == 0) {
                        clearInterval(this.downloadIntervalTimer);
                        this.downloadIntervalTimer = null;
                    }
                }
            } else {
                // automatically download data if not already in progress
                if (recent.canDownload && !this.downloading[recent.deviceId]) {
                    this.downloadData(recent.deviceId);
                } else {
                    if (!recent.readings || recent.readings < 3) {
                        delete this.downloading[recent.deviceId];
                        const inProgress = Object.keys(this.downloading);
                        if (inProgress.length == 0) {
                            clearInterval(this.downloadIntervalTimer);
                            this.downloadIntervalTimer = null;
                        }
                    }
                }
            }
        },

        createRecent(station) {
            let newSync = {
                readings: 0,
                downloadReadingsLabel: "",
                canDownload: false,
                totalDownloads: "",
                totalUploads: "",
                lastDownloadTime: "",
                lastUploadTime: "",
                uploadProgressLabel: _L("waitingToUpload"),
                uploadState: "waiting"
            };
            if (station.station) {
                newSync.name = station.station.name;
                newSync.deviceId = station.station.deviceId;
                newSync.readings = station.pending.records;
                newSync.downloadReadingsLabel =
                    station.pending.records + " " + _L("readings");
                newSync.canDownload = station.pending.records > 0;
            } else {
                newSync.name = station.name;
                newSync.deviceId = station.deviceId;
            }
            this.recentSyncs.push(newSync);
            if (Config.syncMode != "manual") {
                // automatically download data
                if (newSync.canDownload) {
                    this.downloadData(newSync.deviceId);
                }
            }
            return newSync;
        },

        handleDeviceUpload(recent, deviceUpload) {
            if (deviceUpload) {
                recent.canUpload = true;
                recent.uploadSize = convertBytesToLabel(deviceUpload.size);
                recent.uploadStatus = recent.uploadSize + " " + _L("toUpload");
                if (recent.uploadSize == "0 KB") {
                    recent.canUpload = false;
                }

                if (Config.syncMode != "manual") {
                    // automatically start uploading if none in progress
                    if (!this.uploadInProgress) {
                        this.uploadData().catch(e => {
                            // not parsing error message for now,
                            // unsure about iOS side, seems to be breaking
                            // if (
                            //     e.toString().indexOf("Unable to resolve host") > -1
                            // ) {
                            //     recent.uploadProgressLabel =
                            //         "Unable to upload. Are you connected to the internet?";
                            // }
                            recent.uploadProgressLabel = _L(
                                "failedCheckConnection"
                            );
                            recent.uploadStatus =
                                recent.uploadSize + " " + _L("toUpload");
                            recent.uploadState = "waiting";
                            const inProgress = Object.keys(this.uploading);
                            if (inProgress.length == 0) {
                                clearInterval(this.uploadIntervalTimer);
                                this.uploadIntervalTimer = null;
                            }
                        });
                    }
                }
            }
        },

        handleUploadProgress(data) {
            this.recentSyncs.forEach(s => {
                if (data[s.deviceId]) {
                    let recent = s;
                    let uploadInfo = data[s.deviceId];
                    recent.canUpload = true;
                    if (recent.uploadSize == "0 KB") {
                        recent.canUpload = false;
                    }
                    if (uploadInfo.progress == 100) {
                        delete this.uploading[recent.deviceId];
                        recent.uploadStatus = _L("uploadSuccessful");
                        recent.uploadProgressLabel =
                            recent.uploadSize + " " + _L("uploaded");
                        recent.uploadState = "success";
                    } else {
                        this.$set(this.uploading, recent.deviceId, true);
                        recent.uploadProgressLabel = _L("uploading");
                        recent.uploadState = "uploading";
                    }
                    const inProgress = Object.keys(this.uploading);
                    if (inProgress.length == 0) {
                        this.uploadInProgress = false;
                        clearInterval(this.uploadIntervalTimer);
                        this.uploadIntervalTimer = null;
                    }
                }
            });
        },

        onDownloadTap(event) {
            if (Config.syncMode != "manual") {
                return;
            }
            const deviceId = event.object.dataDeviceId;
            this.downloadData(deviceId);
        },

        downloadData(deviceId) {
            this.$set(this.downloading, deviceId, true);
            if (!this.downloadIntervalTimer) {
                this.downloadIntervalTimer = setInterval(
                    this.rotateDownloadingIcon,
                    500
                );
            }
            return Services.StateManager()
                .synchronizeStation(deviceId)
                .catch(error => {
                    console.log("ERROR SYNC STATION", JSON.stringify(error));
                    console.log("ERROR SYNC STATION", error.message, error);
                    console.error("ERROR SYNC STATION", error.message, error);
                });
        },

        onUploadTap(event) {
            if (Config.syncMode != "manual") {
                return;
            }
            const deviceId = event.object.dataDeviceId;
            let recent = this.recentSyncs.find(r => {
                return r.deviceId == deviceId;
            });

            if (!this.uploadInProgress) {
                this.uploadData().catch(e => {
                    // not parsing error message for now,
                    // unsure about iOS side, seems to be breaking
                    // if (
                    //     e.toString().indexOf("Unable to resolve host") > -1
                    // ) {
                    //     recent.uploadProgressLabel =
                    //         "Unable to upload. Are you connected to the internet?";
                    // }
                    recent.uploadProgressLabel = _L("failedCheckConnection");
                    recent.uploadStatus =
                        recent.uploadSize + " " + _L("toUpload");
                    recent.uploadState = "waiting";
                    const inProgress = Object.keys(this.uploading);
                    if (inProgress.length == 0) {
                        clearInterval(this.uploadIntervalTimer);
                        this.uploadIntervalTimer = null;
                    }
                });
            }
        },

        uploadData() {
            if (!this.uploadIntervalTimer) {
                this.uploadIntervalTimer = setInterval(
                    this.rotateUploadingIcon,
                    500
                );
            }

            return Services.StateManager()
                .synchronizePortal()
                .catch(error => {
                    console.error("ERROR SYNC PORTAL", error);
                    if (error.offline && !this.askedOnce) {
                        return confirm({
                            title: "FieldKit",
                            message: _L("loginPrompt"),
                            okButtonText: _L("yes"),
                            cancelButtonText: _L("notNow")
                        }).then(res => {
                            if (res) {
                                this.$navigateTo(routes.login, {});
                            } else {
                                this.askedOnce = true;
                            }
                        });
                    }
                    throw new Error(error);
                });
        },

        getFormattedDateTime(date) {
            if (date && typeof date == "string") {
                date = new Date(date);
            }
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = date.getFullYear();
            const origHour = date.getHours();
            const suffix = origHour < 12 ? " AM" : " PM";
            let hour = origHour % 12 == 0 ? 12 : origHour % 12;
            hour = hour < 10 ? "0" + hour : hour;
            let origMinutes = date.getMinutes();
            const minutes = origMinutes < 10 ? "0" + origMinutes : origMinutes;
            return (
                month +
                "/" +
                day +
                "/" +
                year +
                " " +
                hour +
                ":" +
                minutes +
                suffix
            );
        },

        rotateDownloadingIcon() {
            this.downloadingIcon =
                this.downloadingIcon == "~/images/Icon_Syncing.png"
                    ? "~/images/Icon_Syncing2.png"
                    : "~/images/Icon_Syncing.png";
        },

        rotateUploadingIcon() {
            this.uploadingIcon =
                this.uploadingIcon == "~/images/Icon_Syncing.png"
                    ? "~/images/Icon_Syncing2.png"
                    : "~/images/Icon_Syncing.png";
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles

.station-container {
    margin: 20;
}
.station-name {
    background-color: $fk-primary-blue;
    clip-path: polygon(0 0, 92% 0%, 98% 100%, 0% 100%);
    color: white;
    padding: 10 20;
    font-size: 18;
}
.bottom-border {
    margin-left: 15%;
    margin-right: 2%;
    margin-top: 10;
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}
.status {
    font-size: 18;
    color: $fk-gray-dark;
}
.history-label {
    font-weight: bold;
    margin-top: 10;
}
</style>
