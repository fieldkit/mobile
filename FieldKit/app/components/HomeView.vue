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

export default {
    data() {
        return {
            message: _L("authenticated")
        };
    },
    methods: {
        onPageLoaded() {
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
