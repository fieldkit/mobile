<template>
    <StackLayout class="sync-panel-container" @loaded="onLoaded">
        <StackLayout
            v-for="s in recentSyncs"
            :key="s.deviceId"
            class="station-container"
        >
            <Label :text="s.name" textWrap="true" class="station-name"></Label>
            <template v-if="s.canDownload">
                <GridLayout rows="*,*,*" columns="15*,70*,15*" class="m-t-20">
                    <Image
                        rowSpan="2"
                        col="0"
                        width="25"
                        src="~/images/readings.png"
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
                        text="Downloading"
                        textWrap="true"
                    ></Label>
                    <Image
                        rowSpan="2"
                        col="2"
                        width="25"
                        src="~/images/download.png"
                        v-if="!downloading[s.deviceId]"
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
                    <Label text="Not connected to station" />
                </StackLayout>
            </template>
            <template v-else>
                <StackLayout class="m-20">
                    <Label text="Checking for data to download..." />
                </StackLayout>
            </template>

            <template v-if="s.canUpload">
                <GridLayout rows="*,*,*" columns="15*,70*,15*" class="m-t-20">
                    <Image
                        rowSpan="2"
                        col="0"
                        width="25"
                        src="~/images/readings.png"
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
                        src="~/images/ready.png"
                        v-if="s.uploadState == 'waiting'"
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
                        src="~/images/success.png"
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
</template>

<script>
import _ from "lodash";
import Services from "../services/services";
import Config from "../config";
import routes from "../routes";

import { convertBytesToLabel } from "../utilities";

const log = Config.logger("SynchronizePanel");

export default {
    data() {
        return {
            recentSyncs: [],
            downloadingIcon: "~/images/syncing.png",
            uploadingIcon: "~/images/syncing.png",
            downloading: {},
            uploading: {},
            uploadInProgress: false
        };
    },

    methods: {
        onLoaded(args) {
            log.info("loaded");

            const stateManager = Services.StateManager();

            log.info("subscribed");

            stateManager.subscribe(status => {
                log.info("status", status, "portal", status.portal);
                this.manageRecentSyncs(status);
            });

            Services.ProgressService().subscribe(data => {
                if (data.message && data.message == "Uploading") {
                    this.uploadInProgress = true;
                    this.handleUploadProgress(data);
                }
            });
        },

        manageRecentSyncs(status) {
            status.station.stations.forEach(s => {
                const station = s;
                let recent = this.recentSyncs.find(r => {
                    return r.deviceId == station.station.deviceId;
                });
                if (recent) {
                    this.updateRecent(recent, station, status);
                } else {
                    this.createRecent(station, status);
                }
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
            recent.downloadReadingsLabel = recent.readings + " Readings";
            // need higher limit than 0, or get stuck in loop
            recent.canDownload = recent.readings > 3;
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
            const deviceUpload = status.portal.find(p => {
                return p.deviceId == recent.deviceId;
            });
            this.handleDeviceUpload(recent, deviceUpload);
        },

        createRecent(station, status) {
            let newSync = {
                name: station.station.name,
                deviceId: station.station.deviceId,
                stationId: station.station.id,
                readings: station.pending.records,
                downloadReadingsLabel: station.pending.records + " Readings",
                canDownload: station.pending.records > 0,
                uploadProgressLabel: "Waiting to upload",
                uploadState: "waiting"
            };
            const deviceUpload = status.portal.find(p => {
                return p.deviceId == station.station.deviceId;
            });
            this.handleDeviceUpload(newSync, deviceUpload);
            this.recentSyncs.push(newSync);
            // automatically download data
            if (newSync.canDownload) {
                this.downloadData(newSync.deviceId);
            }
        },

        handleDeviceUpload(recent, deviceUpload) {
            if (deviceUpload) {
                recent.uploadSize = convertBytesToLabel(deviceUpload.size);
                recent.uploadStatus = recent.uploadSize + " to upload";
                recent.canUpload = true;

                // start uploading if none in progress
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
                        recent.uploadProgressLabel =
                            "Unable to upload. Are you connected to the internet?";
                        recent.uploadStatus = recent.uploadSize + " to upload";
                        recent.uploadState = "waiting";
                        const inProgress = Object.keys(this.uploading);
                        if (inProgress.length == 0) {
                            clearInterval(this.uploadIntervalTimer);
                            this.uploadIntervalTimer = null;
                        }
                    });
                }
            }
        },

        handleUploadProgress(data) {
            let recent = this.recentSyncs.find(r => {
                return r.deviceId == data.station.deviceId;
            });
            recent.canUpload = true;
            if (data.progress == 100) {
                delete this.uploading[recent.deviceId];
                recent.uploadStatus = "Upload successful";
                recent.uploadProgressLabel = recent.uploadSize + " uploaded";
                recent.uploadState = "success";
            } else {
                this.$set(this.uploading, recent.deviceId, true);
                recent.uploadProgressLabel = "Uploading";
                recent.uploadState = "uploading";
            }
            const inProgress = Object.keys(this.uploading);
            if (inProgress.length == 0) {
                this.uploadInProgress = false;
                clearInterval(this.uploadIntervalTimer);
                this.uploadIntervalTimer = null;
            }
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
                    if (error.offline) {
                        return confirm({
                            title: "FieldKit",
                            message:
                                "You're not logged in. Would you like to login so that you can upload your data?",
                            okButtonText: "Yes",
                            cancelButtonText: "Not Now"
                        }).then(res => {
                            if (res) {
                                this.$navigateTo(routes.login, {});
                            }
                        });
                    }
                    throw new Error(error);
                });
        },

        rotateDownloadingIcon() {
            this.downloadingIcon =
                this.downloadingIcon == "~/images/syncing.png"
                    ? "~/images/syncing2.png"
                    : "~/images/syncing.png";
        },

        rotateUploadingIcon() {
            this.uploadingIcon =
                this.uploadingIcon == "~/images/syncing.png"
                    ? "~/images/syncing2.png"
                    : "~/images/syncing.png";
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
</style>
