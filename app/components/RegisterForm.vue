<template>
    <FlexboxLayout class="registration-form">
        <LabeledTextField v-model="form.name" label="Name" @blur="checkName" />
        <Label
            v-show="form.v.name.required"
            id="name-required"
            class="validation-error"
            horizontalAlignment="left"
            :text="_L('nameRequired')"
            textWrap="true"
        />

        <Label
            v-show="form.v.name.length"
            id="email-length"
            class="validation-error"
            horizontalAlignment="left"
            text="Name too long."
            textWrap="true"
        />

        <LabeledTextField v-model="form.email" label="Email" @blur="checkEmail" />
        <Label
            v-show="form.v.email.required"
            id="email-required"
            class="validation-error"
            horizontalAlignment="left"
            :text="_L('emailRequired')"
            textWrap="true"
        />

        <Label
            v-show="form.v.email.length"
            id="email-length"
            class="validation-error"
            horizontalAlignment="left"
            text="Email too long."
            textWrap="true"
        />

        <Label
            v-show="form.v.email.format"
            id="email-format"
            class="validation-error"
            horizontalAlignment="left"
            text="Invalid Email"
            textWrap="true"
        />

        <LabeledTextField v-model="form.password" label="Password" @blur="checkPassword" :secure="true" />
        <Label
            v-show="form.v.password.required"
            id="password-required"
            class="validation-error"
            horizontalAlignment="left"
            :text="_L('passwordRequired')"
            textWrap="true"
        />
        <Label
            v-show="form.v.password.length"
            id="password-length"
            class="validation-error"
            horizontalAlignment="left"
            text="Password too short."
            textWrap="true"
        />

        <LabeledTextField v-model="form.confirmPassword" label="Password" @blur="checkConfirmPassword" :secure="true" />
        <Label
            v-show="form.v.confirmPassword.required"
            id="confirm-password-required"
            class="validation-error"
            horizontalAlignment="left"
            :text="_L('passwordRequired')"
            textWrap="true"
        />
        <Label
            v-show="form.v.confirmPassword.sameAs"
            id="confirm-password-sameAs"
            class="validation-error"
            horizontalAlignment="left"
            :text="_L('noMatch')"
            textWrap="true"
        />

        <Button class="btn btn-primary btn-padded m-t-20" :text="_L('signUp')" :isEnabled="!busy" @tap="register" />
    </FlexboxLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { fullRoutes } from "@/routes";
import SharedComponents from "@/components/shared";
import { Dialogs } from "@nativescript/core";
import { email } from "vuelidate/lib/validators";
import { debug } from "@/lib/debugging";

const ErrorUserEmailRegistered = "user-email-registered";

export default Vue.extend({
    name: "RegisterForm",
    components: {
        ...SharedComponents,
    },
    data(): {
        busy: boolean;
        form: {
            name: string;
            email: string;
            password: string;
            confirmPassword: string;
            v: {
                name: { required: boolean; length: boolean; format: boolean };
                email: { required: boolean; length: boolean; format: boolean };
                password: { required: boolean; length: boolean };
                confirmPassword: { required: boolean; sameAs: boolean };
            };
        };
    } {
        return {
            busy: false,
            form: {
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                v: {
                    name: { required: false, length: false, format: false },
                    email: { required: false, length: false, format: false },
                    password: { required: false, length: false },
                    confirmPassword: { required: false, sameAs: false },
                },
            },
        };
    },
    methods: {
        checkName(): void {
            this.form.v.name.required = this.form.name.length == 0;
            this.form.v.name.length = this.form.name.length > 256;
        },
        checkEmail(): void {
            this.form.v.email.required = this.form.email.length == 0;
            this.form.v.email.length = this.form.email.length > 40;
            this.form.v.email.format = this.form.email.length > 0 && !email(this.form.email);
        },
        checkPassword(): void {
            this.form.v.password.required = this.form.password.length == 0;
            this.form.v.password.length = this.form.password.length > 0 && this.form.password.length < 10;
        },
        checkConfirmPassword(): void {
            this.form.v.confirmPassword.required = this.form.confirmPassword.length == 0;
            this.form.v.confirmPassword.sameAs = this.form.password != this.form.confirmPassword;
        },
        async continueOffline(): Promise<void> {
            await this.$deprecatedNavigateTo(fullRoutes.onboarding.assemble, { clearHistory: true });
        },
        invalid(): boolean {
            this.checkName();
            this.checkEmail();
            this.checkPassword();
            this.checkConfirmPassword();
            if (this.form.v.name.required) return true;
            if (this.form.v.name.length) return true;
            if (this.form.v.email.required) return true;
            if (this.form.v.email.length) return true;
            if (this.form.v.email.format) return true;
            if (this.form.v.password.required) return true;
            if (this.form.v.password.length) return true;
            if (this.form.v.confirmPassword.required) return true;
            if (this.form.v.confirmPassword.sameAs) return true;
            return false;
        },
        async register(): Promise<void> {
            if (this.invalid()) {
                return;
            }
            this.busy = true;
            try {
                const portal = this.$services.PortalInterface();
                const returned = await portal.register({
                    name: this.form.name,
                    email: this.form.email,
                    password: this.form.password,
                });

                debug.log(`returned: ${JSON.stringify(returned)}`, "a");

                await this.$deprecatedNavigateTo(fullRoutes.onboarding.assemble);
            } catch (error) {
                this.busy = false;
                if (error && error.response && error.response.data) {
                    debug.log("error", error.response.data);
                    if (error.response.data.name == ErrorUserEmailRegistered) {
                        await this.alert("A user with that email is already registered.");
                        return;
                    }
                }
                await this.alert("An error occured, please contact customer support.");
            } finally {
                this.busy = false;
            }
        },
        alert(message: string): Promise<void> {
            return Dialogs.alert({
                title: "FieldKit",
                okButtonText: _L("ok"),
                message: message,
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.registration-form {
    flex-grow: 2;
    flex-direction: column;
    vertical-align: center;
    justify-content: space-around;
    height: 100%;

    .active {
        border-top-color: $fk-secondary-blue;
    }

    .btn-primary {
        margin: 20 0 15 0;
    }

    .sign-up-label {
        horizontal-align: center;
        margin-bottom: 10;
    }

    .validation-error {
        color: $fk-tertiary-red;
        border-top-color: $fk-tertiary-red;
        border-top-width: 2;
        padding-top: 5;
    }
}
</style>
