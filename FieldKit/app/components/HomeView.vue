<template>
    <Page class="page">
        <ActionBar class="action-bar">
            <Label class="action-bar-title" text="FieldKit"></Label>
        </ActionBar>

        <StackLayout>
            <Label class="body m-20" :text="message" textWrap="true"></Label>
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
            logout() {
                this.$userAuth.logout();
                this.$navigateTo(Login, {
                    clearHistory: true
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
    @import '../app-variables';
    // End custom common variables

    // Custom styles
</style>
