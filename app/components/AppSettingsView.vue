<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="75,*,55">
            <ScreenHeader row="0" :title="_L('fieldkitSettings')" :canNavigateBack="false" :canNavigateSettings="false" class="m-t-10" />
            <ScrollView row="1">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <StackLayout>
                        <Button v-if="loggedIn" class="btn btn-secondary" :text="_L('logOut')" @tap="logout"></Button>
                        <Button v-if="!loggedIn" class="btn btn-primary" :text="_L('logIn')" @tap="goToLogin"></Button>
                    </StackLayout>
                    <StackLayout class="m-x-10 m-y-20">
                        <Label :text="'Build: ' + versions.buildNumber" class="size-16 m-b-10" textWrap="true" />
                        <Label :text="'Time: ' + versions.buildTime" class="size-16 m-b-10" textWrap="true" />
                        <Label :text="'Tag: ' + versions.buildTag" class="size-16 m-b-10" textWrap="true" />
                        <Label :text="'Hash: ' + versions.gitHash" class="size-16 m-b-10" textWrap="true" />
                    </StackLayout>
                </FlexboxLayout>
            </ScrollView>
            <!-- footer -->
            <ScreenFooter row="2" active="settings" />
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";

import ScreenHeader from "./ScreenHeader.vue";
import ScreenFooter from "./ScreenFooter.vue";

import routes from "@/routes";
import { Build } from "@/config";
import Services from "@/services/services";

export default Vue.extend({
    data(this: any) {
        return {
            loggedIn: Services.PortalInterface().isLoggedIn(),
            versions: Build,
        };
    },
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    methods: {
        onPageLoaded(this: any) {},
        logout(this: any) {
            this.$portalInterface.logout();
            this.$navigateTo(routes.login, {
                clearHistory: true,
                props: {
                    resetUser: true,
                },
            });
        },
        goToLogin(this: any) {
            this.$navigateTo(routes.login);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
