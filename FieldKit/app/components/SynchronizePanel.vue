<template>
<StackLayout class="sync-panel-container" @loaded="onLoaded">

    <StackLayout class="sync-button-panel">
        <Label :text="stationStatus" textWrap="true"></Label>

        <Button class="btn btn-primary m-t-10" text="Sync Station" isEnabled="true" @tap="onSyncStation" style="sync-button"></Button>
    </StackLayout>

    <StackLayout class="sync-button-panel">
        <Label :text="portalStatus" textWrap="true"></Label>

        <Button class="btn btn-primary m-t-10" text="Sync Portal" isEnabled="true" @tap="onSyncPortal" style="sync-button"></Button>
    </StackLayout>

    <StackLayout class="sync-panel-progress">
        <ProgressBar />
    </StackLayout>
</StackLayout>
</template>

<script>
import ProgressBar from './ProgressBar';
import Services from '../services/services';
import Config from '../config';
import routes from "../routes";

const log = Config.logger('SynchronizePanel');

export default {
    props: {
        station: Object,
    },

    components: {
        ProgressBar
    },

    data() {
        return {
            visible: true,
            pending: {
                station: 0,
                portal: 0,
            }
        };
    },

    computed: {
        stationStatus: function() {
            const bytes = this.pending.station;
            return `This station has ${bytes} bytes of data waiting to be downloaded.`;
        },

        portalStatus: function() {
            const bytes = this.pending.portal;
            return `There are ${bytes} bytes waiting to upload.`;
        },
    },

    methods: {
        onLoaded(args) {
            log("loaded");
            Services.StateManager().subscribe(status => {
                if (this.station) {
                    const station = status.station.forStation(this.station.id);
                    if (station) {
                        this.pending = {
                            station: station.pending.bytes,
                            portal: status.portal.pending.bytes
                        };
                    }
                }
            });
        },

        onSyncStation() {
            return Services.StateManager().synchronizeConnectedStations().catch(error => {
                console.error("ERROR SYNC STATION", error);
            });
        },

        onSyncPortal() {
            return Services.StateManager().synchronizePortal().catch(error => {
                if (error.offline) {
                    return confirm({
                        title: "FieldKit",
                        message: "You're not logged in. Would you like to login so that you can upload your data?",
                        okButtonText: "Yes",
                        cancelButtonText: "Not Now",
                    }).then((res) => {
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
