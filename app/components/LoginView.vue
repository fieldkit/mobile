<template>
    <Page actionBarHidden="true">
        <ScrollView>
            <FlexboxLayout class="page login-page m-x-10" justifyContent="space-between">
                <Image class="logo" src="~/images/fieldkit-logo-blue.png"></Image>

                <InternetConnectionBanner />

                <LoginForm v-if="login" :busy="busy" @saved="onLoginSaved" @continue="onContinue" />

                <RegisterForm v-else />

                <Label class="sign-up-label" @tap="toggle">
                    <FormattedString>
                        <Span :text="login ? _L('needAccount') : _L('backToLogin')"></Span>
                    </FormattedString>
                </Label>
            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script lang="ts">
import { Vue } from "vue-property-decorator";
import { Dialogs } from "@nativescript/core";
import LoginForm from "./LoginForm.vue";
import RegisterForm from "./RegisterForm.vue";
import { ActionTypes, LoginAction } from "@/store/actions";
import { pages, fullRoutes } from "@/routes";
import { debug, _L } from "@/lib";
import axios from "axios";
import InternetConnectionBanner from "~/components/InternetConnectionBanner.vue";
import AppSettings from "~/wrappers/app-settings";

export default Vue.extend({
    name: "LoginView",
    components: {
        InternetConnectionBanner,
        LoginForm,
        RegisterForm,
    },
    data(): {
        login: boolean;
        busy: boolean;
        isOnline: boolean;
    } {
        return {
            login: true,
            busy: false,
            isOnline: true,
        };
    },
    async mounted(): Promise<void> {
        // eslint-disable-next-line
        return await this.checkIfOnline();
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
                        void this.$services.Store().dispatch(ActionTypes.FIRMWARE_REFRESH);

                        if (!this.$services.PortalInterface().isTncValid()) {
                            // eslint-disable-next-line
                            await this.$navigateTo(pages.AppSettingsTnc, {
                                clearHistory: true,
                            });
                        } else {
                            // eslint-disable-next-line
                            await this.$navigateTo(pages.TabbedLayout, {
                                props: fullRoutes.onboarding.assembleFromLogin.props,
                                clearHistory: true,
                            });
                        }
                    })
                    .catch((error) => {
                        debug.log("error", error);
                        this.busy = false;
                        // eslint-disable-next-line
                        if (!error.response) {
                            return Dialogs.alert(_L("mustBeConnected"));
                        }
                        return Dialogs.alert(_L("loginFailed"));
                    });
            } finally {
                this.busy = false;
            }
        },
        async onContinue(): Promise<void> {
            const appSettings = new AppSettings();
            if (appSettings.getNumber("skipCount") >= 3) {
                // eslint-disable-next-line
                await this.$navigateTo(pages.TabbedLayout, {
                    props: fullRoutes.stations.props,
                    clearHistory: true,
                });
            } else {
                // eslint-disable-next-line
                await this.$navigateTo(pages.TabbedLayout, {
                    props: fullRoutes.onboarding.assemble.props,
                    clearHistory: true,
                });
            }
        },
        async checkIfOnline(): Promise<void> {
            try {
                await axios.request({ url: "https://google.com", timeout: 3000 });
                this.isOnline = true;
            } catch (e) {
                this.isOnline = false;
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

    .labeled-text-field,
    .forgot-password-link {
        margin-top: 10;
    }

    .logo {
        margin-top: 50;
        height: 47;
    }

    .sign-up-label {
        font-size: 14;
        margin-bottom: 10;
        font-weight: bold;
    }
}
</style>
