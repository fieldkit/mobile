<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('fieldkitSettings')" :canNavigateBack="false" :canNavigateSettings="false" />

        <GridLayout rows="*,55">
            <ScrollView row="0">
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
            <ScreenFooter row="1" active="settings" />
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";

import SharedComponents from "@/components/shared";

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
        ...SharedComponents,
    },
    methods: {
        onPageLoaded(this: any) {},
        logout(this: any) {
            Services.PortalInterface().logout();
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
