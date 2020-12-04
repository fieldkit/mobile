<template>
    <Page actionBarHidden="true">
        <ScrollView>
            <FlexboxLayout class="page login-page" justifyContent="space-between">
                <Image class="logo" src="~/images/fieldkit-logo-blue.png"></Image>

                <LoginForm v-if="login" />
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

export default Vue.extend({
    name: "LoginView",
    components: {
        LoginForm,
        RegisterForm,
    },
    data(): {
        login: boolean;
    } {
        return {
            login: true,
        };
    },
    methods: {
        toggle(): void {
            console.log(`toggle-form`);
            this.login = !this.login;
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

.logo {
    margin-top: 50;
    height: 47;
}

.sign-up-label {
    horizontal-align: center;
    margin-bottom: 10;
}
</style>
