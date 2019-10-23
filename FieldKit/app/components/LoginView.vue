<template>
    <Page actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout class="page" justifyContent="space-between">
                <Image class="logo" src="~/images/fieldkit-logo-black.png"></Image>
                <StackLayout class="form">
                    <GridLayout rows="auto, auto, auto, auto">
                        <StackLayout
                            row="0"
                            v-show="!isLoggingIn"
                            class="input-field"
                        >
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
                                @returnPress="focusPassword"
                                @focus="showActive"
                                @blur="checkName"
                            ></TextField>
                            <StackLayout
                                class="spacer-top"
                                id="name-field-spacer"
                            ></StackLayout>
                            <Label
                                class="validation-error"
                                id="no-name"
                                :text="_L('nameRequired')"
                                textWrap="true"
                                :visibility="noName ? 'visible' : 'collapsed'"
                            ></Label>
                            <Label
                                class="validation-error"
                                id="name-too-long"
                                :text="_L('nameOver255')"
                                textWrap="true"
                                :visibility="
                                    nameTooLong ? 'visible' : 'collapsed'
                                "
                            ></Label>
                            <Label
                                class="validation-error"
                                id="name-has-space"
                                :text="_L('nameNoSpaces')"
                                textWrap="true"
                                :visibility="
                                    nameHasSpace ? 'visible' : 'collapsed'
                                "
                            ></Label>
                        </StackLayout>

                        <StackLayout row="1" class="input-field">
                            <GridLayout rows="auto" columns="*">
                                <TextField
                                    row="0"
                                    id="email-field"
                                    class="input"
                                    :hint="_L('email')"
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
                                <Image
                                    row="0"
                                    width="25"
                                    horizontalAlignment="right"
                                    v-show="isLoggingIn"
                                    src="~/images/Icon_Email_login.png"
                                ></Image>
                            </GridLayout>
                            <StackLayout
                                class="spacer-top"
                                id="email-field-spacer"
                            ></StackLayout>
                            <Label
                                class="validation-error"
                                id="no-email"
                                :text="_L('emailRequired')"
                                textWrap="true"
                                :visibility="noEmail ? 'visible' : 'collapsed'"
                            ></Label>
                            <Label
                                class="validation-error"
                                id="email-not-valid"
                                :text="_L('emailNotValid')"
                                textWrap="true"
                                :visibility="
                                    emailNotValid ? 'visible' : 'collapsed'
                                "
                            ></Label>
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
                                    :returnKeyType="
                                        isLoggingIn ? 'done' : 'next'
                                    "
                                    @focus="showActive"
                                    @returnPress="focusConfirmPassword"
                                    @blur="checkPassword"
                                ></TextField>
                                <Image
                                    row="0"
                                    width="25"
                                    horizontalAlignment="right"
                                    v-show="isLoggingIn"
                                    src="~/images/Icon_Password_login.png"
                                ></Image>
                            </GridLayout>
                            <StackLayout
                                class="spacer-top"
                                id="password-field-spacer"
                            ></StackLayout>
                            <Label
                                class="validation-error"
                                id="no-password"
                                :text="_L('passwordRequired')"
                                textWrap="true"
                                :visibility="
                                    noPassword ? 'visible' : 'collapsed'
                                "
                            ></Label>
                            <Label
                                class="validation-error"
                                id="password-too-short"
                                :text="_L('passwordTooShort')"
                                textWrap="true"
                                :visibility="
                                    passwordTooShort ? 'visible' : 'collapsed'
                                "
                            ></Label>
                            <Label
                                class="m-t-5"
                                horizontalAlignment="right"
                                v-show="isLoggingIn"
                                :text="_L('forgotLink')"
                                @tap="forgotPassword()"
                            ></Label>
                        </StackLayout>

                        <StackLayout
                            row="3"
                            v-show="!isLoggingIn"
                            class="input-field"
                        >
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
                            <StackLayout
                                class="spacer-top"
                                id="confirm-password-field-spacer"
                            ></StackLayout>
                            <Label
                                class="validation-error"
                                id="passwords-not-match"
                                :text="_L('noMatch')"
                                textWrap="true"
                                :visibility="
                                    passwordsNotMatch ? 'visible' : 'collapsed'
                                "
                            ></Label>
                        </StackLayout>

                        <ActivityIndicator
                            rowSpan="4"
                            :busy="processing"
                        ></ActivityIndicator>
                    </GridLayout>

                    <Button
                        class="btn btn-primary m-t-20"
                        :text="isLoggingIn ? _L('logIn') : _L('signUp')"
                        :isEnabled="!processing"
                        @tap="submit"
                    ></Button>

                    <Button
                        class="btn btn-primary m-t-20"
                        text="Continue Offline"
                        @tap="continueOffline"
                    ></Button>
                </StackLayout>

                <Label class="sign-up-label" @tap="toggleForm">
                    <FormattedString>
                        <Span
                            :text="
                                isLoggingIn
                                    ? _L('needAccount')
                                    : _L('backToLogin')
                            "
                        ></Span>
                    </FormattedString>
                </Label>
            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
import Home from "./HomeView";
import Stations from "./StationListView";
import Config from "../config";
import { USERNAME, PASSWORD } from "../secrets";

export default {
    data() {
        return {
            isLoggingIn: true,
            processing: false,
            noName: false,
            nameTooLong: false,
            nameHasSpace: false,
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
                confirmPassword: ""
            }
        };
    },
    props: ["resetUser"],
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
            this.nameHasSpace = matches && matches.length > 0;
            this.nameTooLong = this.user.name.length > 255;
        },

        checkEmail(event) {
            let spacer = this.page.getViewById("email-field-spacer");
            spacer.className = "spacer-top";
            this.noEmail = !this.user.email || this.user.email.length == 0;
            if (this.noEmail) {
                return;
            }
            let emailPattern = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
            this.emailNotValid = !emailPattern.test(this.user.email);
        },

        checkPassword(event) {
            let spacer = this.page.getViewById("password-field-spacer");
            spacer.className = "spacer-top";
            this.noPassword =
                !this.user.password || this.user.password.length == 0;
            if (this.noPassword) {
                return;
            }
            this.passwordTooShort = this.user.password.length < 10;
        },

        checkConfirmPassword(event) {
            let spacer = this.page.getViewById("confirm-password-field-spacer");
            spacer.className = "spacer-top";
            this.passwordsNotMatch =
                this.user.password != this.user.confirmPassword;
        },

        continueOffline() {
            if (!this.navigatedAway) {
                this.$navigateTo(Stations, { clearHistory: true });
                this.navigatedAway = true;
            }
        },

        submit() {
            if (!this.user.email || !this.user.password) {
                this.alert(_L("provideBoth"));
                return;
            }

            this.processing = true;
            if (this.isLoggingIn) {
                this.login();
            } else {
                this.register();
            }
        },

        login() {
            return this.$portalInterface
                .login(this.user)
                .then(() => {
                    this.processing = false;
                    this.$navigateTo(Config.seedDB ? Home : Stations, {
                        clearHistory: true
                    });
                })
                .catch(error => {
                    this.processing = false;
                    if (!this.navigatedAway) {
                        this.alert(_L("loginFailed"));
                    }
                });
        },

        register() {
            if (this.user.password != this.user.confirmPassword) {
                this.alert(_L("noMatch"));
                this.processing = false;
                return;
            }

            return this.$portalInterface
                .register(this.user)
                .then(() => {
                    this.processing = false;
                    this.alert(_L("accountCreated"));
                    this.isLoggingIn = true;
                })
                .catch(() => {
                    this.processing = false;
                    this.alert(_L("accountCreateFailed"));
                });
        },

        forgotPassword() {
            prompt({
                title: _L("forgotTitle"),
                message: _L("forgotInstruction"),
                inputType: "email",
                defaultText: "",
                okButtonText: _L("ok"),
                cancelButtonText: _L("cancel")
            }).then(data => {
                if (data.result) {
                    this.$portalInterface
                        .resetPassword(data.text.trim())
                        .then(() => {
                            this.alert(_L("passwordResetSucceeded"));
                        })
                        .catch(() => {
                            this.alert(_L("passwordResetFailed"));
                        });
                }
            });
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
                message: message
            });
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

.page {
    color: $fk-primary-black;
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
    border-top-color: $fk-gray-border;
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
