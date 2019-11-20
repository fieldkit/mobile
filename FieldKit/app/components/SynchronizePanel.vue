<template>
    <StackLayout class="sync-panel-container" @loaded="onLoaded">
        <StackLayout
            v-for="s in stations"
            :key="s.station.id"
            class="station-container"
        >
            <Label
                :text="s.station.name"
                textWrap="true"
                class="station-name"
            ></Label>
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
                        :text="s.downloadStatus"
                        textWrap="true"
                        class="status"
                    ></Label>
                    <Label
                        row="1"
                        col="1"
                        text="Ready to download"
                        textWrap="true"
                    ></Label>
                    <Image
                        rowSpan="2"
                        col="2"
                        width="25"
                        src="~/images/download.png"
                        v-if="!downloading[s.station.deviceId]"
                        :dataDeviceId="s.station.deviceId"
                        @tap="onDownloadData"
                    ></Image>
                    <Image
                        rowSpan="2"
                        col="2"
                        width="25"
                        src="~/images/syncing.png"
                        v-if="downloading[s.station.deviceId]"
                    ></Image>
                    <StackLayout
                        row="2"
                        colSpan="3"
                        class="bottom-border"
                    ></StackLayout>
                </GridLayout>
            </template>
            <template v-else>
                <StackLayout class="m-20">
                    <Label text="Nothing to download" />
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
                        text="Ready to upload"
                        textWrap="true"
                    ></Label>
                    <Image
                        rowSpan="2"
                        col="2"
                        width="25"
                        src="~/images/ready.png"
                        v-if="!uploading[s.station.deviceId]"
                        :dataDeviceId="s.station.deviceId"
                        @tap="onUploadData"
                    ></Image>
                    <Image
                        rowSpan="2"
                        col="2"
                        width="25"
                        src="~/images/syncing.png"
                        v-if="uploading[s.station.deviceId]"
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
import Services from "../services/services";
import Config from "../config";
import routes from "../routes";

import { convertBytesToLabel } from "../utilities";

const log = Config.logger("SynchronizePanel");

export default {
    data() {
        return {
            downloading: {},
            uploading: {},
            stations: []
        };
    },

    methods: {
        onLoaded(args) {
            log.info("loaded");

            const stateManager = Services.StateManager();

            log.info("subscribed");

            stateManager.subscribe(status => {
                log.info('status', status, 'portal', status.portal);

                this.stations = status.station.stations.sort((a, b) => {
                    return b.station.name > a.station.name
                        ? 1
                        : b.station.name < a.station.name
                        ? -1
                        : 0;
                });

                // update stations with new status
                this.stations.forEach(s => {
                    s.readings = s.pending.records;
                    s.downloadStatus = s.readings + " Readings";
                    s.canDownload = s.readings > 0;
                    const toUpload = status.portal.find(p => {
                        return p.stationId == s.station.id.toString();
                    });
                    if(toUpload) {
                        s.uploadStatus = convertBytesToLabel(toUpload.size) + " to upload";
                        s.canUpload = true;
                    } else {
                        s.canUpload = false;
                    }
                });
            });

            Services.ProgressService().subscribe(data => {
                if(data.message) {
                    if(data.message == "Downloading") {
                        if(data.station && data.progress == 100) {
                            // give it a bit extra time, as status does not update immedately
                            setTimeout(() => {
                                this.$set(this.downloading, data.station.deviceId, false);
                            }, 1000);
                        }
                    } else if(data.message == "Uploading") {
                        if(data.station && data.progress == 100) {
                            setTimeout(() => {
                                this.$set(this.uploading, data.station.deviceId, false);
                            }, 1000);
                        }
                    }
                }
            });
        },

        onDownloadData(event) {
            const deviceId = event.object.dataDeviceId;
            this.$set(this.downloading, deviceId, true);
            return Services.StateManager()
                .synchronizeStation(deviceId)
                .catch(error => {
                    console.log("ERROR SYNC STATION", JSON.stringify(error));
                    console.log("ERROR SYNC STATION", error.message, error);
                    console.error("ERROR SYNC STATION", error.message, error);
                });
        },

        onUploadData(event) {
            const deviceId = event.object.dataDeviceId;
            this.$set(this.uploading, deviceId, true);
            return Services.StateManager()
                .synchronizePortal()
                .catch(error => {
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
                    console.error("ERROR SYNC PORTAL", error);
                });
        },
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
