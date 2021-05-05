<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.account.accounts')" :canNavigateSettings="false" />
        <GridLayout rows="*,auto">
            <ScrollView row="0">
                <DockLayout stretchLastChild="true" backgroundColor="white">
                    <StackLayout dock="top" v-for="account in accounts" :key="account.email" class="account-container">
                        <GridLayout rows="auto" columns="30,*,30" @tap="onToggle(account)">
                            <Image
                                col="0"
                                v-if="currentUser && account.email == currentUser.email"
                                width="15"
                                class="v-middle"
                                src="~/images/Icon_Save_Account.png"
                            />
                            <StackLayout col="0" row="0" v-else />
                            <StackLayout col="1" row="0">
                                <Label :text="account.email" textWrap="true" class="account-email" />
                                <Label text="Logged In" textWrap="true" class="account-subtitle" v-if="account.token" />
                                <Label text="Not Logged In" textWrap="true" class="account-subtitle" v-else />
                            </StackLayout>

                            <FlexboxLayout
                                row="0"
                                col="2"
                                class="container-icon"
                                flexDirection="column"
                                justifyContent="space-around"
                                alignItems="center"
                            >
                                <Image v-show="opened(account)" class="icon-button" width="25" src="~/images/Icon_Cheveron_Up.png" />
                                <Image v-show="!opened(account)" class="icon-button" width="25" src="~/images/Icon_Cheveron_Down.png" />
                            </FlexboxLayout>
                        </GridLayout>
                        <StackLayout v-if="opened(account)" class="details-container">
                            <Label :text="'Last synchronized at ' + prettyTime(account.lastSynced)" />
                            <Button class="btn" text="Log Out" v-if="account.token && false" />
                            <Button class="btn" text="Log In" v-if="!account.token && false" />
                            <Button
                                class="btn"
                                text="Switch"
                                @tap="onChooseAccount(account)"
                                v-if="!currentUser || currentUser.email != account.email"
                            />
                            <Button class="btn" text="Remove" @tap="onRemove(account)" />
                            <Button class="btn" text="Sync" @tap="onSync(account)" />
                        </StackLayout>
                    </StackLayout>
                    <GridLayout rows="auto" columns="20,*" @tap="addAccount" class="m-t-15 m-r-20 m-l-20">
                        <Image width="20" height="20" row="0" col="0" src="~/images/Icon_Add_Button.png" verticalAlignment="center" />
                        <Label
                            :text="_L('appSettings.account.addAccount')"
                            class="size-16 m-10"
                            row="0"
                            col="1"
                            verticalAlignment="center"
                        />
                    </GridLayout>
                </DockLayout>
            </ScrollView>
            <StackLayout row="1" class="m-r-20 m-l-20">
                <Button class="btn btn-secondary btn-logout" :text="_L('appSettings.account.removeAll')" @tap="logoutAll"></Button>
            </StackLayout>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import moment from "moment";
import Vue from "vue";
import SharedComponents from "@/components/shared";
import SettingsItemSlider from "./SettingsItemSlider.vue";
import SettingsItemIconText from "./SettingsItemIconText.vue";
import { Dialogs } from "@nativescript/core";
import { ActionTypes, CurrentUser, RemoveAccountAction, SyncAccountAction } from "@/store";
import { routes } from "@/routes";
import Services from "@/services/singleton";
import { _L } from "@/lib";

export default Vue.extend({
    data(): {
        closed: { [index: string]: boolean };
    } {
        return {
            closed: {},
        };
    },
    computed: {
        currentUser(): CurrentUser | null {
            return this.$s.state.portal.currentUser;
        },
        accounts(): CurrentUser[] {
            return this.$s.state.portal.accounts;
        },
    },
    components: {
        ...SharedComponents,
        SettingsItemSlider,
        SettingsItemIconText,
    },
    async mounted(): Promise<void> {
        void this.$s.dispatch(ActionTypes.REFRESH_ACCOUNTS);
    },
    methods: {
        prettyTime(date: Date | null): string {
            if (date) {
                return moment(date).format("YYYY/MM/DD h:mm:ss");
            }
            return "N/A";
        },
        onToggle(account: CurrentUser): void {
            Vue.set(this.closed, account.email, this.opened(account));
        },
        opened(account: CurrentUser): boolean {
            if (this.closed[account.email] === true) {
                return false;
            }
            if (this.closed[account.email] === false) {
                return true;
            }
            return false;
        },
        onLogin(account: CurrentUser): void {
            // Confirm
        },
        onLogout(account: CurrentUser): void {
            // Confirm
        },
        async onSync(account: CurrentUser): Promise<void> {
            const yesNo = await Dialogs.confirm({
                title: "Are you sure you would like to sync this account?",
                okButtonText: _L("yes"),
                cancelButtonText: _L("no"),
            });
            if (yesNo) {
                void this.$s.dispatch(new SyncAccountAction(account.email));
            }
        },
        async onRemove(account: CurrentUser): Promise<void> {
            const yesNo = await Dialogs.confirm({
                title: "Are you sure you would like to remove this account?",
                okButtonText: _L("yes"),
                cancelButtonText: _L("no"),
            });
            if (yesNo) {
                await this.$s.dispatch(new RemoveAccountAction(account.email));
            }
        },
        async onChooseAccount(account: CurrentUser): Promise<void> {
            await Services.Store().dispatch(ActionTypes.CHANGE_ACCOUNT, account.email);
        },
        async addAccount(): Promise<void> {
            await this.$navigateTo(routes.appSettings.accountAdd, {});
        },
        async logoutAll(): Promise<void> {
            const yesNo = await Dialogs.confirm({
                title: "Are you sure?",
                okButtonText: _L("yes"),
                cancelButtonText: _L("no"),
            });
            if (yesNo) {
                await Services.PortalInterface().logout();
            }
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
}

.btn-secondary {
    font-size: 18;
    text-transform: none;
    font-family: "Avenir LT Pro", "AvenirLTPro-Heavy";
    font-weight: bold;
    border-color: $fk-primary-red;
    border-width: 1;
    background-color: white;
}

.v-middle {
    vertical-align: middle;
}

.account-container {
    margin: 15;
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 4;
    padding: 10;
}

.details-container {
    margin-top: 10;
    padding-top: 15;
    padding-bottom: 5;
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}

.account-email {
    font-size: 18;
}

.container {
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}
</style>
