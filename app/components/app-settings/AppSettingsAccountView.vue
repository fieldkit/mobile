<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.account.account')" :canNavigateSettings="false" />
        <GridLayout rows="*,auto">
            <ScrollView row="0" class="m-r-20 m-l-20">
                <StackLayout>
                    <StackLayout class="top-bordered-item">
                        <Label :text="_L('appSettings.account.accounts')" class="size-16 m-5 m-t-20 m-b-25" />
                    </StackLayout>
                    <StackLayout
                        v-for="account in accounts"
                        orientation="horizontal"
                        class="v-middle m-b-16"
                        :key="account.email"
                        @tap="(ev) => onChooseAccount(account)"
                    >
                        <Label :text="account.email" class="size-14 m-10 v-middle" />
                        <Image
                            v-if="currentUser && account.email == currentUser.email"
                            width="10"
                            class="v-middle"
                            src="~/images/Icon_Save.png"
                        />
                    </StackLayout>
                    <GridLayout rows="50" columns="20, *" @tap="addAccount" class="m-t-15">
                        <Image width="20" height="20" row="0" col="0" src="~/images/Icon_Add_Button.png" verticalAlignment="center" />
                        <Label
                            :text="_L('appSettings.account.addAccount')"
                            class="size-16 m-10"
                            row="0"
                            col="1"
                            verticalAlignment="center"
                        />
                    </GridLayout>
                </StackLayout>
            </ScrollView>
            <StackLayout row="1" class="m-r-20 m-l-20">
                <Button class="btn btn-secondary btn-logout" :text="_L('appSettings.account.logoutAll')" @tap="logoutAll"></Button>
            </StackLayout>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import SettingsItemSlider from "./SettingsItemSlider.vue";
import SettingsItemIconText from "./SettingsItemIconText.vue";
import { ActionTypes } from "~/store/actions";
import routes from "@/routes";
import Services from "@/services/singleton";

export default Vue.extend({
    data(): {} {
        return {};
    },
    computed: {
        currentUser() {
            return this.$s.state.portal.currentUser;
        },
        accounts() {
            return this.$s.state.portal.accounts;
        },
    },
    components: {
        ...SharedComponents,
        SettingsItemSlider,
        SettingsItemIconText,
    },
    methods: {
        async addAccount(): Promise<void> {
            await this.$navigateTo(routes.appSettings.accountAdd, {});
        },
        async logoutAll(): Promise<void> {
            await Services.PortalInterface().logout();
        },
        async onChooseAccount(account): Promise<void> {
            await Services.Store().dispatch(ActionTypes.CHANGE_ACCOUNT, account.email);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.bottom-bordered-item {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.top-bordered-item {
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}

.btn-logout {
    margin-right: 0;
    margin-left: 0;
    margin-top: 85;
}

.v-middle {
    vertical-align: middle;
}
</style>
