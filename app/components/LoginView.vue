<template>
    <Page actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout class="page login-page" justifyContent="space-between">
                <Image class="logo" src="~/images/fieldkit-logo-blue.png"></Image>
                <StackLayout class="form">
                    <GridLayout rows="auto, auto, auto, auto">
                        <StackLayout row="0" v-show="!isLoggingIn" class="input-field">
                            <TextField
                                id="name-field"
                                class="input"
                                :hint="_L('name')"
                                horizontalAlignment="left"
                                :isEnabled="!processing"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="user.name"
                                returnKeyType="next"
                                @returnPress="focusEmail"
                                @focus="showActive"
                                @blur="checkName"
                            ></TextField>
                            <StackLayout class="spacer-top" id="name-field-spacer" v-show="!noName && !nameTooLong"></StackLayout>
                            <Label class="validation-error" id="no-name" :text="_L('nameRequired')" textWrap="true" v-show="noName"></Label>
                            <Label class="validation-error" id="name-too-long" :text="_L('nameOver255')" textWrap="true" v-show="nameTooLong"></Label>
                        </StackLayout>

                        <StackLayout row="1" class="input-field">
                            <GridLayout rows="auto" columns="*">
                                <TextField
                                    row="0"
                                    id="email-field"
                                    class="input"
                                    :hint="_L('email')"
                                    ref="email"
                                    horizontalAlignment="left"
                                    :isEnabled="!processing"
                                    keyboardType="email"
                                    autocorrect="false"
                                    autocapitalizationType="none"
                                    v-model="user.email"
                                    automationText="loginEmailInput"
                                    returnKeyType="next"
                                    @focus="showActive"
                                    @returnPress="focusPassword"
                                    @blur="checkEmail"
                                ></TextField>
                                <Image row="0" width="25" class="bottom-pad" horizontalAlignment="right" v-show="isLoggingIn" src="~/images/Icon_Email_login.png"></Image>
                            </GridLayout>
                            <StackLayout class="spacer-top" id="email-field-spacer" v-show="!noEmail && !emailNotValid"></StackLayout>
                            <Label class="validation-error" id="no-email" :text="_L('emailRequired')" textWrap="true" v-show="noEmail"></Label>
                            <Label class="validation-error" id="email-not-valid" :text="_L('emailNotValid')" textWrap="true" v-show="emailNotValid"></Label>
                        </StackLayout>

                        <StackLayout row="2" class="input-field">
                            <GridLayout rows="auto" columns="*">
                                <TextField
                                    id="password-field"
                                    class="input"
                                    :hint="_L('password')"
                                    secure="true"
                                    ref="password"
                                    horizontalAlignment="left"
                                    :isEnabled="!processing"
                                    v-model="user.password"
                                    automationText="loginPasswordInput"
                                    :returnKeyType="isLoggingIn ? 'done' : 'next'"
                                    @focus="showActive"
                                    @returnPress="focusConfirmPassword"
                                    @blur="checkPassword"
                                ></TextField>
                                <Image row="0" width="25" class="bottom-pad" horizontalAlignment="right" v-show="isLoggingIn" src="~/images/Icon_Password_login.png"></Image>
                            </GridLayout>
                            <StackLayout class="spacer-top" id="password-field-spacer" v-show="!noPassword && !passwordTooShort"></StackLayout>
                            <Label class="validation-error" id="no-password" :text="_L('passwordRequired')" textWrap="true" v-show="noPassword"></Label>
                            <Label class="validation-error" id="password-too-short" :text="_L('passwordTooShort')" textWrap="true" v-show="passwordTooShort"></Label>
                            <Label class="m-t-5" horizontalAlignment="right" v-show="isLoggingIn" :text="_L('forgotLink')" @tap="forgotPassword()"></Label>
                        </StackLayout>

                        <StackLayout row="3" v-show="!isLoggingIn" class="input-field">
                            <TextField
                                id="confirm-password-field"
                                class="input"
                                :hint="_L('confirmPassword')"
                                secure="true"
                                ref="confirmPassword"
                                horizontalAlignment="left"
                                :isEnabled="!processing"
                                v-model="user.confirmPassword"
                                returnKeyType="done"
                                @focus="showActive"
                                @blur="checkConfirmPassword"
                            ></TextField>
                            <StackLayout class="spacer-top" id="confirm-password-field-spacer" v-show="!passwordsNotMatch"></StackLayout>
                            <Label class="validation-error" id="passwords-not-match" :text="_L('noMatch')" textWrap="true" v-show="passwordsNotMatch"></Label>
                        </StackLayout>

                        <ActivityIndicator rowSpan="4" :busy="processing"></ActivityIndicator>
                    </GridLayout>

                    <Button class="btn btn-primary btn-padded m-t-20" :text="isLoggingIn ? _L('logIn') : _L('signUp')" :isEnabled="!processing" @tap="submit"></Button>

                    <Button class="btn btn-primary btn-padded m-t-20" :text="_L('continueOffline')" @tap="continueOffline"></Button>
                </StackLayout>

                <Label class="sign-up-label" @tap="toggleForm">
                    <FormattedString>
                        <Span :text="isLoggingIn ? _L('needAccount') : _L('backToLogin')"></Span>
                    </FormattedString>
                </Label>
            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
import AssembleStation from "./onboarding/AssembleStationView";
import Config from "../config";
import routes from "../routes";
import { USERNAME, PASSWORD } from "../secrets";
import * as ActionTypes from "../store/actions";
import Services from "../services/services";

export default {
    data() {
        return {
            isLoggingIn: true,
            processing: false,
            noName: false,
            nameTooLong: false,
            noEmail: false,
            emailNotValid: false,
            noPassword: false,
            passwordTooShort: false,
            passwordsNotMatch: false,
            navigatedAway: false,
            user: {
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
            },
        };
    },
    props: {
        resetUser: {
            required: false,
        },
    },
    methods: {
        onPageLoaded(args) {
            // logging out sends resetUser = true
            this.page = args.object;
            if (USERNAME && PASSWORD && !this.resetUser) {
                this.user.email = USERNAME;
                this.user.password = PASSWORD;
                this.login();
            }
        },

        toggleForm() {
            this.isLoggingIn = !this.isLoggingIn;
        },

        showActive(event) {
            let spacer = this.page.getViewById(event.object.id + "-spacer");
            spacer.className = "spacer-top active";
        },

        checkName(event) {
            let spacer = this.page.getViewById("name-field-spacer");
            spacer.className = "spacer-top";
            this.noName = !this.user.name || this.user.name.length == 0;
            if (this.noName) {
                return;
            }
            let matches = this.user.name.match(/\s/g);
            this.nameTooLong = this.user.name.length > 255;
        },

        checkEmail(event) {
            let spacer = this.page.getViewById("email-field-spacer");
            spacer.className = "spacer-top";
            this.noEmail = !this.user.email || this.user.email.length == 0;
            if (this.noEmail) {
                return;
            }
            let emailPattern = /^([a-zA-Z0-9_+\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
            this.emailNotValid = !emailPattern.test(this.user.email);
        },

        checkPassword(event) {
            let spacer = this.page.getViewById("password-field-spacer");
            spacer.className = "spacer-top";
            this.noPassword = !this.user.password || this.user.password.length == 0;
            if (this.noPassword) {
                return;
            }
            this.passwordTooShort = this.user.password.length < 10;
        },

        checkConfirmPassword(event) {
            let spacer = this.page.getViewById("confirm-password-field-spacer");
            spacer.className = "spacer-top";
            this.passwordsNotMatch = this.user.password != this.user.confirmPassword;
        },

        continueOffline() {
            if (!this.navigatedAway) {
                this.navigatedAway = true;
                return this.$navigateTo(routes.assembleStation, { clearHistory: true });
            }
        },

        submit() {
            if (!this.user.email || !this.user.password) {
                return this.alert(_L("provideBoth"));
            }

            this.processing = true;
            if (this.isLoggingIn) {
                return this.login();
            } else {
                return this.register();
            }
        },

        login() {
            return Services.PortalInterface()
                .login(this.user)
                .then(token => {
                    this.processing = false;
                    return this.$store.dispatch(ActionTypes.AUTHENTICATED, token).then(() => {
                        return this.$navigateTo(routes.assembleStation, {
                            clearHistory: true,
                        });
                    });
                })
                .catch(error => {
                    this.processing = false;
                    if (!this.navigatedAway) {
                        return this.alert(_L("loginFailed"));
                    }
                });
        },

        register() {
            if (this.user.password != this.user.confirmPassword) {
                this.processing = false;
                return this.alert(_L("noMatch"));
            }

            return Services.PortalInterface()
                .register(this.user)
                .then(() => {
                    this.processing = false;
                    this.isLoggingIn = true;
                    return this.alert(_L("accountCreated"));
                })
                .catch(() => {
                    this.processing = false;
                    return this.alert(_L("accountCreateFailed"));
                });
        },

        forgotPassword() {
            prompt({
                title: _L("forgotTitle"),
                message: _L("forgotInstruction"),
                inputType: "email",
                defaultText: "",
                okButtonText: _L("ok"),
                cancelButtonText: _L("cancel"),
            }).then(data => {
                if (data.result) {
                    return Services.PortalInterface()
                        .logout(data.text.trim())
                        .then(() => {
                            return this.alert(_L("passwordResetSucceeded"));
                        })
                        .catch(() => {
                            return this.alert(_L("passwordResetFailed"));
                        });
                }
            });
        },

        focusEmail() {
            this.$refs.email.nativeView.focus();
        },
        focusPassword() {
            this.$refs.password.nativeView.focus();
        },
        focusConfirmPassword() {
            if (!this.isLoggingIn) {
                this.$refs.confirmPassword.nativeView.focus();
            }
        },

        alert(message) {
            return alert({
                title: "FieldKit",
                okButtonText: _L("ok"),
                message: message,
            });
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

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
