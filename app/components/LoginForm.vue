<template>
    <FlexboxLayout class="login-form form">
        <LabeledTextField
            v-model="form.email"
            label="Email"
            @blur="checkEmail"
            :isEnabled="!busy"
            :invalid="form.v.email.required || form.v.email.length || form.v.email.format"
        />
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

        <LabeledTextField
            v-model="form.password"
            label="Password"
            @blur="checkPassword"
            :secure="true"
            :isEnabled="!busy"
            :invalid="form.v.password.required || form.v.password.length"
            class="m-t-20"
        />
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

        <Label class="forgot-password-link m-t-12" :text="_L('forgotLink')" @tap="forgotPassword" />

        <Button class="btn btn-primary btn-padded m-t-20" :text="_L('logIn')" :isEnabled="!busy" @tap="login" />

        <Button
            class="btn btn-primary btn-padded m-t-20"
            :text="_L('continueOffline')"
            @tap="continueOffline"
            v-if="allowContinueOffline"
        />
    </FlexboxLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { Dialogs } from "@nativescript/core";
import SharedComponents from "@/components/shared";
import { fullRoutes } from "@/routes";
import { _L } from "@/lib";
import { email } from "vuelidate/lib/validators";
import AppSettings from '~/wrappers/app-settings';

export default Vue.extend({
    name: "LoginForm",
    components: {
        ...SharedComponents,
    },
    props: {
        busy: {
            type: Boolean,
            default: false,
        },
        allowContinueOffline: {
            type: Boolean,
            default: true,
        },
    },
    data(): {
        form: {
            email: string;
            password: string;
            v: {
                email: { required: boolean; length: boolean; format: boolean };
                password: { required: boolean; length: boolean };
            };
        };
    } {
        return {
            form: {
                email: "",
                password: "",
                v: {
                    email: { required: false, length: false, format: false },
                    password: { required: false, length: false },
                },
            },
        };
    },
    methods: {
        checkEmail(): void {
            this.form.v.email.required = this.form.email.length == 0;
            this.form.v.email.length = this.form.email.length > 40;
            this.form.v.email.format = this.form.email.length > 0 && !email(this.form.email);
        },
        checkPassword(): void {
            this.form.v.password.required = this.form.password.length == 0;
            this.form.v.password.length = this.form.password.length > 0 && this.form.password.length < 10;
        },
        async continueOffline(): Promise<void> {
            const appSettings = new AppSettings();
            const skipCount = appSettings.getNumber("skipCount");

            if (skipCount >= 3) {
                await this.$deprecatedNavigateTo(fullRoutes.stations);
                return;
            }

            await this.$deprecatedNavigateTo(fullRoutes.onboarding.assemble);
        },
        invalid(): boolean {
            this.checkEmail();
            this.checkPassword();
            if (this.form.v.email.required) return true;
            if (this.form.v.email.length) return true;
            if (this.form.v.email.format) return true;
            if (this.form.v.password.required) return true;
            if (this.form.v.password.length) return true;
            return false;
        },
        async login(): Promise<void> {
            if (!this.invalid()) {
                this.$emit("saved", this.form);
            }
        },
        alert(message: string): Promise<void> {
            return Dialogs.alert({
                title: "FieldKit",
                okButtonText: _L("ok"),
                message: message,
            });
        },
        async forgotPassword(): Promise<void> {
            await Dialogs.prompt({
                title: _L("forgotTitle"),
                message: _L("forgotInstruction"),
                inputType: "email",
                defaultText: "",
                okButtonText: _L("ok"),
                cancelButtonText: _L("cancel"),
            }).then(async (data) => {
                if (data.result) {
                    if (data.text) {
                        await this.$services
                            .PortalInterface()
                            .forgotPassword({ email: data.text })
                            .then(() => this.alert(_L("passwordResetSucceeded")))
                            .catch(() => this.alert(_L("passwordResetFailed")));
                    } else {
                        await this.forgotPassword();
                    }
                }
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.login-form {
    flex-grow: 2;
    vertical-align: center;
    flex-direction: column;
    justify-content: space-around;
    margin: 0;
    padding: 0;

    .forgot-password-link {
        font-weight: bold;
        font-size: 14;
        text-align: right;
    }

    .logo {
        margin-top: 50;
        height: 47;
    }

    .active {
        border-top-color: $fk-secondary-blue;
    }

    .btn-primary {
        margin: 20 0 15 0;
    }

    .validation-error {
        color: $fk-tertiary-red;
        padding-top: 5;
    }
}
</style>
