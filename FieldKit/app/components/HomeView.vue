<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <Label v-if="loggedIn" class="plain m-20 text-center" :text="message" textWrap="true"></Label>
            <Button class="btn btn-primary" :text="_L('viewStations')" @tap="viewStations"></Button>
            <Button class="btn btn-primary" text="Copy Logs" @tap="copyLogs"></Button>
        </StackLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import { sendLogs } from '../lib/logging';

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
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
</style>
