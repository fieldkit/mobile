<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.account.addAccount')" :canNavigateBack="true" :canNavigateSettings="false" />
        <ScrollView>
            <FlexboxLayout class="page login-page" flexDirection="column">
                <LoginForm v-if="login" :allowContinueOffline="false" :busy="busy" @saved="onLoginSaved" />

                <RegisterForm v-else />

                <Label class="sign-up-label m-t-30 size-14" @tap="toggle">
                    <FormattedString>
                        <Span :text="login ? _L('needAccount') : _L('backToLogin')"></Span>
                    </FormattedString>
                </Label>
            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import LoginForm from "./LoginForm.vue";
import RegisterForm from "./RegisterForm.vue";
import { LoginAction } from "@/store/actions";
import SharedComponents from "@/components/shared";

export default Vue.extend({
    name: "AppSettingsAccountAddView",
    components: {
        ...SharedComponents,
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
            console.log(`toggle-form`);
            this.login = !this.login;
        },
        async onLoginSaved(form: { email: string; password: string }): Promise<void> {
            this.busy = true;
            try {
                await this.$services
                    .Store()
                    .dispatch(new LoginAction(form.email, form.password))
                    .then(() => this.$navigateBack())
                    .catch((error) => {
                        console.log("error", error);
                        this.busy = false;
                        return alert(_L("loginFailed"));
                    });
            } finally {
                this.busy = false;
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
    horizontal-align: center;
    margin-bottom: 10;
}
</style>
