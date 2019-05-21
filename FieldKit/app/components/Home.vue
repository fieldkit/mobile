<template>
    <Page class="page">
        <ActionBar class="action-bar">
            <Label class="action-bar-title" text="FieldKit"></Label>
        </ActionBar>

        <StackLayout>
            <Label class="body m-20" :text="message" textWrap="true"></Label>
            <Button class="btn btn-primary" :text="_L('logOut')" @tap="logout"></Button>
        </StackLayout>
    </Page>
</template>

<script>
    import Login from "./Login";

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
