<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <Label class="plain m-20 text-center" :text="message" textWrap="true"></Label>
            <Button class="btn btn-primary" :text="_L('viewStations')" @tap="viewStations"></Button>
            <Button class="btn btn-secondary" :text="_L('logOut')" @tap="logout"></Button>
        </StackLayout>
    </Page>
</template>

<script>
import Login from "./LoginView";
import Stations from "./StationsView";
import Services from "../services/services";

// TODO: Remove
import { Observable } from "tns-core-modules/data/observable";

export default {
    data() {
        return {
            message: _L("authenticated")
        };
    },

    methods: {
        onPageLoaded() {
            console.log("loaded");

            const callbacks = {
            };

            try {
                Services.StateManager().synchronizeLocalData(callbacks).catch(err => {
                    console.log(err);
                });
            }
            catch (error) {
                console.log(error);
            }

            this.$stationMonitor.on(Observable.propertyChangeEvent, () => {
                try {
                    // if (false)
                    Services.StateManager().synchronizeConnectedStations(callbacks).then(() => {
                        return Services.StateManager().synchronizeLocalData(callbacks);
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
