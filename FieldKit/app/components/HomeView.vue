<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <Label v-if="loggedIn" class="plain m-20 text-center" :text="message" textWrap="true"></Label>
            <Button class="btn btn-primary" :text="_L('viewStations')" @tap="viewStations"></Button>
            <StackLayout class="spacer m-t-30"></StackLayout>
            <Label text="temporary buttons" class="size-14 text-center m-t-20 m-b-20" />
            <Button class="btn btn-primary" text="Copy Logs" @tap="copyLogs"></Button>
            <Button class="btn btn-primary" text="Delete DB" @tap="deleteDB"></Button>
            <Button class="btn btn-primary" text="Delete app copies of station data" @tap="deleteFiles"></Button>
        </StackLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import { sendLogs } from '../lib/logging';
import Services from '../services/services';
import { knownFolders } from "tns-core-modules/file-system";

const createDB = Services.CreateDb();

export default {
    data() {
        return {
            message: _L("authenticated"),
            loggedIn: this.$portalInterface.isLoggedIn()
        };
    },
    methods: {
        onPageLoaded() {
        },
        viewStations() {
            this.$navigateTo(routes.stations);
        },
        copyLogs() {
            sendLogs();
        },
        deleteDB() {
            const userInvokedDelete = true;
            createDB.initialize(userInvokedDelete).then(result => {
                this.$stationMonitor.clearStations();
            });
        },
        deleteFiles() {
            const dataFolder = knownFolders.currentApp().getFolder("FieldKitData");
            dataFolder.remove()
                .then(() => {
                    console.log("Data folder successfully deleted");
                }).catch((err) => {
                    console.log("Error removing data folder", err.stack);
                });
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.spacer {
    border-top-color: $fk-gray-border;
    border-top-width: 2;
}
</style>
