<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <Label class="plain m-20 text-center" :text="message" textWrap="true"></Label>
            <Button class="btn btn-primary" :text="_L('viewStations')" @tap="viewStations"></Button>
            <Button class="btn btn-secondary" :text="_L('logOut')" @tap="logout"></Button>

            <ProgressBar></ProgressBar>
        </StackLayout>
    </Page>
</template>

<script>
import Login from "./LoginView";
import Stations from "./StationsView";
import Services from "../services/services";
import ProgressBar from './ProgressBar';

// TODO: Remove
import { Observable } from "tns-core-modules/data/observable";

export default {
    data() {
        return {
            message: _L("authenticated")
        };
    },
    components: {
        ProgressBar,
    },
    methods: {
        onPageLoaded() {
            console.log("loaded");

            if (false) {
                try {
                    Services.StateManager().synchronizeLocalData().catch(err => {
                        console.log(err);
                    });
                }
                catch (error) {
                    console.log('error', error);
                }
            }

            if (this.$stationMonitor.getStations().length > 0) {
                try {
                    Services.StateManager().synchronizeConnectedStations().then(() => {
                        return Services.StateManager().synchronizeLocalData();
                    }).catch(err => {
                        console.log(err);
                    });
                }
                catch (e) {
                    console.log("error", e);
                }
            }
            else {
            }

            this.$stationMonitor.on(Observable.propertyChangeEvent, () => {
                try {
                    Services.StateManager().synchronizeConnectedStations().then(() => {
                        return Services.StateManager().synchronizeLocalData();
                    }).catch(err => {
                        console.log(err);
                    });
                }
                catch (e) {
                    console.log("error", e);
                }
            });
        },
        logout() {
            this.$portalInterface.logout();
            this.$navigateTo(Login, {
                clearHistory: true,
                props: {
                    resetUser: true
                }
            });
        },
        viewStations() {
            this.$navigateTo(Stations);
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
