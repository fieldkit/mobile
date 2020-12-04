<template>
    <StackLayout class="form">
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

        <Label class="m-t-5" horizontalAlignment="right" :text="_L('forgotLink')" @tap="forgotPassword" />

        <Button class="btn btn-primary btn-padded m-t-20" :text="_L('logIn')" :isEnabled="!busy" @tap="login" />

        <Button
            class="btn btn-primary btn-padded m-t-20"
            :text="_L('continueOffline')"
            @tap="continueOffline"
            v-if="allowContinueOffline"
        />
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "@/routes";
import SharedComponents from "@/components/shared";
import { Dialogs } from "@nativescript/core";

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
                email: { required: boolean; format: boolean };
                password: { required: boolean; length: boolean };
            };
        };
    } {
        return {
            form: {
                email: "",
                password: "",
                v: {
                    email: { required: false, format: false },
                    password: { required: false, length: false },
                },
            },
        };
    },
    methods: {
        checkEmail(): void {
            const emailPattern = /^([a-zA-Z0-9_+-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
            this.form.v.email.required = this.form.email.length == 0;
            this.form.v.email.format = this.form.email.length > 0 && !emailPattern.test(this.form.email);
        },
        checkPassword(): void {
            this.form.v.password.required = this.form.password.length == 0;
            this.form.v.password.length = this.form.password.length > 0 && this.form.password.length < 10;
        },
        async continueOffline(): Promise<void> {
            await this.$navigateTo(routes.onboarding.assembleStation, { clearHistory: true });
        },
        invalid(): boolean {
            this.checkEmail();
            this.checkPassword();
            if (this.form.v.email.required) return true;
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
            alert({
                title: "FieldKit",
                okButtonText: _L("ok"),
                message: message,
            });
            return Promise.resolve();
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
                    await this.$services
                        .PortalInterface()
                        .forgotPassword({ email: data.text })
                        .then(() => this.alert(_L("passwordResetSucceeded")))
                        .catch(() => this.alert(_L("passwordResetFailed")));
                }
            });
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

.form {
    margin-left: 5;
    margin-right: 5;
    flex-grow: 2;
    vertical-align: center;
}

.logo {
    margin-top: 50;
    height: 47;
}

.spacer-top {
    border-top-color: $fk-gray-lighter;
    border-top-width: 2;
}

.active {
    border-top-color: $fk-secondary-blue;
}

.input-field {
    margin-bottom: 15;
}

.input {
    width: 100%;
    font-size: 16;
    color: $fk-primary-black;
    placeholder-color: $fk-gray-hint;
}

.input:disabled {
    opacity: 0.5;
}

.btn-primary {
    margin: 20 5 15 5;
}

.bottom-pad {
    margin-bottom: 8;
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
</style>
