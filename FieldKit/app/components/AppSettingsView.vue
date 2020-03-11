<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="75,*,55">
            <ScreenHeader row="0" title="FieldKit Settings" :canNavigateBack="false" :canNavigateSettings="false" class="m-t-10" />
            <ScrollView row="1">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <StackLayout>
                        <Button v-if="loggedIn" class="btn btn-secondary" :text="_L('logOut')" @tap="logout"></Button>
                        <Button v-if="!loggedIn" class="btn btn-primary" :text="_L('logIn')" @tap="goToLogin"></Button>
                    </StackLayout>
                    <StackLayout class="m-x-10 m-y-20">
                        <Label :text="'App build time: ' + versions.appBuildTime" class="size-16 m-b-10" textWrap="true" />
                        <Label :text="'App build number: ' + versions.appBuildNumber" class="size-16 m-b-10" textWrap="true" />
                        <Label :text="'Build Tag: ' + versions.appBuildTag" class="size-16 m-b-10" textWrap="true" />
                        <Label :text="'Commit: ' + versions.appCommit" class="size-16 m-b-10" textWrap="true" />
                        <Label :text="'Branch: ' + versions.appBranch" class="size-16 m-b-10" textWrap="true" />
                    </StackLayout>
                </FlexboxLayout>
            </ScrollView>
            <!-- footer -->
            <ScreenFooter row="2" active="settings" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import ScreenHeader from "./ScreenHeader";
import ScreenFooter from "./ScreenFooter";
import { hexStringToByteWiseString } from "../utilities";
import { Build } from "../config";

export default {
    data() {
        return {
            loggedIn: this.$portalInterface.isLoggedIn(),
            versions: {
                appBuildTime: Build.buildTime,
                appBuildNumber: Build.buildTime,
                appBuildTag: Build.buildTime,
                appCommit: hexStringToByteWiseString(Build.commit),
                appBranch: Build.branch,
            },
        };
    },
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    methods: {
        onPageLoaded() {},

        logout() {
            this.$portalInterface.logout();
            this.$navigateTo(routes.login, {
                clearHistory: true,
                props: {
                    resetUser: true,
                },
            });
        },

        goToLogin() {
            this.$navigateTo(routes.login);
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
</style>
