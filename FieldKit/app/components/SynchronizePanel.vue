<template>
<StackLayout class="sync-panel-container" @loaded="onLoaded" v-show="visible">
    <StackLayout orientation="horizontal" class="sync-button-panel">
        <Button class="btn btn-primary m-t-10" text="Sync Station" isEnabled="true" @tap="onSyncStation" style="sync-button"></Button>
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

export default {
    data() {
        return {
            visible: true,
        };
    },

    components: {
        ProgressBar
    },

    computed: {
        styling: function() {
            return {
            };
        },
    },

    methods: {
        onLoaded(args) {
            this.stateManager = Services.StateManager();
            return this.stateManager.getStatus().then(status => {
                console.log("status", status.portal);
                console.log("status", status.station);
            }).catch(error => {
                console.log(error);
            });
        },

        onSyncStation() {
            return this.stateManager.synchronizeConnectedStations().catch(error => {
                console.log("SYNC STATION", error);
            });
        },

        onSyncPortal() {
            return this.stateManager.synchronizePortal().catch(error => {
                console.log("SYNC PORTAL", error);
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
