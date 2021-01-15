<template>
    <Page actionBarHidden="true">
        <ScrollView>
            <FlexboxLayout class="page login-page" justifyContent="space-between">
                <Image class="logo" src="~/images/fieldkit-logo-blue.png"></Image>

                <LoginForm v-if="login" :busy="busy" @saved="onLoginSaved" />

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
import Vue from "vue";
import LoginForm from "./LoginForm.vue";
import RegisterForm from "./RegisterForm.vue";
import routes from "@/routes";
import { LoginAction } from "@/store/actions";

export default Vue.extend({
    name: "LoginView",
    components: {
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
                    .then(() => {
                        return this.$navigateTo(routes.onboarding.assembleStation, {
                            frame: "outer-frame",
                            clearHistory: true,
                        });
                    })
                    .catch((error) => {
                        console.log("error", error);
                        this.busy = false;
                        return alert(_L("loginFailed"));
                    });
            } finally {
                this.busy = false;
            }
        },
        /*
        async onRegisterSaved(form: { name:string;email: string; password: string }): Promise<void> {
        },
		*/
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

.logo {
    margin-top: 50;
    height: 47;
}

.sign-up-label {
    horizontal-align: center;
    margin-bottom: 10;
}
</style>
