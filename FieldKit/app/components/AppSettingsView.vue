<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="75,*,55">
            <ScreenHeader
                row="0"
                title="FieldKit Settings"
                :canNavigateBack="false"
                :canNavigateSettings="false"
                class="m-t-10"
            />
            <StackLayout row="1" verticalAlignment="middle">
                <Button
                    v-if="loggedIn"
                    class="btn btn-primary"
                    :text="_L('logOut')"
                    @tap="logout"
                ></Button>
                <Button
                    v-if="!loggedIn"
                    class="btn btn-primary"
                    :text="_L('logIn')"
                    @tap="goToLogin"
                ></Button>
            </StackLayout>
            <!-- footer -->
            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import ScreenHeader from "./ScreenHeader";
import ScreenFooter from "./ScreenFooter";

export default {
    data() {
        return {
            loggedIn: this.$portalInterface.isLoggedIn()
        };
    },
    components: {
        ScreenHeader,
        ScreenFooter
    },
    methods: {
        onPageLoaded() {},

        logout() {
            this.$portalInterface.logout();
            this.$navigateTo(routes.login, {
                clearHistory: true,
                props: {
                    resetUser: true
                }
            });
        },

        goToLogin() {
            this.$navigateTo(routes.login);
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
