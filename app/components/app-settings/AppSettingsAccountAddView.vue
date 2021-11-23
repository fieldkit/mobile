<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.account.addAccount')" :canNavigateSettings="false" :canCancel="true" />
        <SettingsLayout class="m-x-10">
            <InternetConnectionBanner />
            <GridLayout rows="*,auto">
                <LoginForm row="0" v-if="login" :allowContinueOffline="false" :busy="busy" @saved="onLoginSaved" />

                <RegisterForm row="0" v-else />

                <Label row="1" class="sign-up-label m-t-30 size-14" @tap="toggle">
                    <FormattedString>
                        <Span :text="login ? _L('needAccount') : _L('backToLogin')"></Span>
                    </FormattedString>
                </Label>
            </GridLayout>
        </SettingsLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import LoginForm from "../LoginForm.vue";
import RegisterForm from "../RegisterForm.vue";
import { LoginAction } from "@/store";
import SharedComponents from "@/components/shared";
import { Dialogs } from "@nativescript/core";
import {_L, debug} from "@/lib";
import { fullRoutes } from "~/routes";
import InternetConnectionBanner from '~/components/InternetConnectionBanner.vue';

export default Vue.extend({
    name: "AppSettingsAccountAddView",
    components: {
        ...SharedComponents,
        InternetConnectionBanner,
        LoginForm,
        RegisterForm,
    },
    data(): {
        login: boolean;
        busy: boolean;
    } {
        return {
            login: true,
            busy: false,
        };
    },
    methods: {
        toggle(): void {
            debug.log(`toggle-form`);
            this.login = !this.login;
        },
        async onLoginSaved(form: { email: string; password: string }): Promise<void> {
            this.busy = true;
            try {
                await this.$services
                    .Store()
                    .dispatch(new LoginAction(form.email, form.password))
                    .then(async () => {
                        if (!this.$services.PortalInterface().isTncValid()) {
                            await this.$deprecatedNavigateTo(fullRoutes.tnc);
                        } else {
                            this.$navigateBack();
                        }
                    })
                    .catch((error) => {
                        debug.log("error", error);
                        this.busy = false;
                        if (!error.response) {
                            return Dialogs.alert(_L('mustBeConnected'));
                        }
                        return Dialogs.alert(_L("loginFailed"));
                    });
            } finally {
                // this.busy = false;
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.login-page {
    font-size: 16;
    align-items: center;
    flex-direction: column;
}

.sign-up-label {
    font-size: 14;
    margin-bottom: 10;
    font-weight: bold;
}
</style>
