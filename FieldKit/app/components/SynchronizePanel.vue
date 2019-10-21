<template>
    <StackLayout class="sync-panel-container" @loaded="onLoaded">
        <StackLayout class="sync-button-panel" v-if="canDownload">
            <Label :text="stationStatus" textWrap="true"></Label>

            <Button
                class="btn btn-primary m-t-10"
                text="Sync Station"
                isEnabled="true"
                @tap="onSyncStation"
                style="sync-button"
            ></Button>
        </StackLayout>

        <StackLayout class="sync-button-panel" v-if="canUpload">
            <Label :text="portalStatus" textWrap="true"></Label>

            <Button
                class="btn btn-primary m-t-10"
                text="Sync Portal"
                isEnabled="true"
                @tap="onSyncPortal"
                style="sync-button"
            ></Button>
        </StackLayout>

        <StackLayout
            class="sync-button-panel"
            v-if="!canDownload && !canUpload"
        >
            <Label text="There is nothing to download or upload."></Label>
        </StackLayout>

        <StackLayout class="sync-panel-progress">
            <ProgressBar />
        </StackLayout>
    </StackLayout>
</template>

<script>
import ProgressBar from "./ProgressBar";
import Services from "../services/services";
import Config from "../config";
import routes from "../routes";

import { convertBytesToLabel } from "../utilities";

const log = Config.logger("SynchronizePanel");

export default {
    props: {
        station: Object
    },

    components: {
        ProgressBar
    },

    data() {
        return {
            canDownload: false,
            canUpload: false,
            pending: {
                station: 0,
                portal: 0
            }
        };
    },

    computed: {
        stationStatus: function() {
            const { bytes, records } = this.pending.station;
            return `This station has ${bytes} of data waiting to be downloaded (${records} records).`;
        },

        portalStatus: function() {
            const { bytes, records } = this.pending.portal;
            return `There are ${bytes} waiting to upload.`;
        }
    },

    methods: {
        onLoaded(args) {
            log.info("loaded");

            const stateManager = Services.StateManager();

            log.info("subscribed");

            stateManager.subscribe(status => {
                log.info("status", this.station.id, 'status', status, 'portal', status.portal);

                function getPortal() {
                    return {
                        bytes: convertBytesToLabel(status.portal.pending.bytes),
                        size: status.portal.pending.bytes,
                    };
                }

                function getStation(id) {
                    const station = status.station.forStation(id);
                    if (station) {
                        return {
                            bytes: convertBytesToLabel(station.pending.bytes),
                            size: station.pending.bytes,
                            records: station.pending.records
                        };
                    }
                    return {
                        bytes: '',
                        size: 0,
                        records: 0,
                    };
                }

                const portal = getPortal();
                const station = getStation(this.station.id);

                this.canDownload = station.size > 0;
                this.canUpload = portal.size > 0;

                this.pending = {
                    station: station,
                    portal: portal,
                };
            });
        },

        onSyncStation() {
            return Services.StateManager()
                .synchronizeStation(this.station.deviceId)
                .catch(error => {
                    console.log("ERROR SYNC STATION", JSON.stringify(error));
                    console.log("ERROR SYNC STATION", error.message, error);
                    console.error("ERROR SYNC STATION", error.message, error);
                });
        },

        onSyncPortal() {
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

.sync-bar-container {
    width: 100%;
    text-align: center;
}

.sync-panel-progress {
    margin-left: 20px;
    margin-right: 20px;
}

.sync-button-panel {
    text-align: center;
}

.sync-button {
}
</style>
