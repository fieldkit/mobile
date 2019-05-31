<template>
    <Page actionBarHidden="true">
        <ScrollView>
            <FlexboxLayout class="page" justifyContent="space-between">
                <StackLayout class="form">
                    <Image class="logo" src="~/images/logo.png"></Image>

                    <GridLayout rows="auto, auto, auto, auto">
                        <StackLayout row="0" v-show="!isLoggingIn" class="input-field">
                            <TextField
                                class="input"
                                hint="Name"
                                :isEnabled="!processing"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="user.name"
                                returnKeyType="next"
                                @returnPress="focusPassword"
                                @blur="checkName"></TextField>
                            <StackLayout class="hr-light"></StackLayout>
                            <Label
                                class="validation-error"
                                id="no-name"
                                text="Name is a required field."
                                textWrap="true"
                                :visibility="noName ? 'visible' : 'collapsed'"></Label>
                            <Label
                                class="validation-error"
                                id="name-too-long"
                                text="Name must be less than 256 letters."
                                textWrap="true"
                                :visibility="nameTooLong ? 'visible' : 'collapsed'"></Label>
                            <Label
                                class="validation-error"
                                id="name-has-space"
                                text="Name must not contain spaces."
                                textWrap="true"
                                :visibility="nameHasSpace ? 'visible' : 'collapsed'"></Label>
                        </StackLayout>

                        <StackLayout row="1" class="input-field">
                            <TextField
                                class="input"
                                hint="Email"
                                :isEnabled="!processing"
                                keyboardType="email"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="user.email"
                                returnKeyType="next"
                                @returnPress="focusPassword"
                                @blur="checkEmail"></TextField>
                            <StackLayout class="hr-light"></StackLayout>
                            <Label
                                class="validation-error"
                                id="no-email"
                                text="Email is a required field."
                                textWrap="true"
                                :visibility="noEmail ? 'visible' : 'collapsed'"></Label>
                            <Label
                                class="validation-error"
                                id="email-not-valid"
                                text="Must be a valid email address."
                                textWrap="true"
                                :visibility="emailNotValid ? 'visible' : 'collapsed'"></Label>
                        </StackLayout>

                        <StackLayout row="2" class="input-field">
                            <TextField
                                class="input"
                                hint="Password"
                                secure="true"
                                ref="password"
                                :isEnabled="!processing"
                                v-model="user.password"
                                :returnKeyType="isLoggingIn ? 'done' : 'next'"
                                @returnPress="focusConfirmPassword"
                                @blur="checkPassword"></TextField>
                            <StackLayout class="hr-light"></StackLayout>
                            <Label
                                class="validation-error"
                                id="no-password"
                                text="Password is a required field."
                                textWrap="true"
                                :visibility="noPassword ? 'visible' : 'collapsed'"></Label>
                            <Label
                                class="validation-error"
                                id="password-too-short"
                                text="Password must be at least 10 characters."
                                textWrap="true"
                                :visibility="passwordTooShort ? 'visible' : 'collapsed'"></Label>
                        </StackLayout>

                        <StackLayout row="3" v-show="!isLoggingIn" class="input-field">
                            <TextField
                                class="input"
                                hint="Confirm password"
                                secure="true"
                                ref="confirmPassword"
                                :isEnabled="!processing"
                                v-model="user.confirmPassword"
                                returnKeyType="done"
                                @blur="checkConfirmPassword"></TextField>
                            <StackLayout class="hr-light"></StackLayout>
                            <Label
                                class="validation-error"
                                id="passwords-not-match"
                                :text="_L('noMatch')"
                                textWrap="true"
                                :visibility="passwordsNotMatch ? 'visible' : 'collapsed'"></Label>
                        </StackLayout>

                        <ActivityIndicator rowSpan="4" :busy="processing"></ActivityIndicator>
                    </GridLayout>

                    <Button
                        class="btn btn-primary m-t-20"
                        :text="isLoggingIn ? _L('logIn') : _L('signUp')"
                        :isEnabled="!processing"
                        @tap="submit"></Button>
                    <Label
                        class="login-label"
                        v-show="isLoggingIn"
                        :text="_L('forgotLink')"
                        @tap="forgotPassword()"></Label>
                </StackLayout>

                <Label class="login-label sign-up-label" @tap="toggleForm">
                    <FormattedString>
                        <Span :text="isLoggingIn ? _L('needAccount') : _L('backToLogin')"></Span>
                        <Span :text="isLoggingIn ? _L('signUp') : ''" class="bold"></Span>
                    </FormattedString>
                </Label>
            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import Home from "./HomeView";

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
                user: {
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: ""
                }
            };
        },
        methods: {
            toggleForm() {
                this.isLoggingIn = !this.isLoggingIn;
            },

            checkName(event) {
                this.noName = !this.user.name || this.user.name.length == 0;
                if(this.noName) {return}
                var matches = this.user.name.match(/\s/g);
                this.nameHasSpace = matches && matches.length > 0;
                this.nameTooLong = this.user.name.length > 255;
            },

            checkEmail(event) {
                this.noEmail = !this.user.email || this.user.email.length == 0;
                if(this.noEmail) {return}
                var emailPattern = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
                this.emailNotValid = !emailPattern.test(this.user.email);
            },

            checkPassword(event) {
                this.noPassword = !this.user.password || this.user.password.length == 0;
                if(this.noPassword) {return}
                this.passwordTooShort = this.user.password.length < 10;
            },

            checkConfirmPassword(event) {
                this.passwordsNotMatch = this.user.password != this.user.confirmPassword;
            },

            submit() {
                if (!this.user.email || !this.user.password) {
                    this.alert(
                        _L("provideBoth")
                    );
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
                this.$userAuth
                    .login(this.user)
                    .then(() => {
                        this.processing = false;
                        this.$navigateTo(Home, { clearHistory: true });
                    })
                    .catch((error) => {
                        this.processing = false;
                        this.alert(
                            error.toString()
                        );
                    });
            },

            register() {
                if (this.user.password != this.user.confirmPassword) {
                    this.alert(_L("noMatch"));
                    this.processing = false;
                    return;
                }

                this.$userAuth
                    .register(this.user)
                    .then(() => {
                        this.processing = false;
                        this.alert(
                            _L("accountCreated"));
                        this.isLoggingIn = true;
                    })
                    .catch(() => {
                        this.processing = false;
                        this.alert(
                            _L("accountCreateFailed")
                        );
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
                        this.$userAuth
                            .resetPassword(data.text.trim())
                            .then(() => {
                                this.alert(
                                    _L("passwordResetSucceeded")
                                );
                            })
                            .catch(() => {
                                this.alert(
                                    _L("passwordResetFailed")
                                );
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
    @import '../app-variables';
    // End custom common variables

    .page {
        align-items: center;
        flex-direction: column;
    }

    .form {
        margin-left: 30;
        margin-right: 30;
        flex-grow: 2;
        vertical-align: middle;
    }

    .logo {
        margin-top: 42;
        margin-bottom: 42;
        height: 47;
    }

    .input-field {
        margin-bottom: 15;
    }

    .input {
        color: $gray-dark;
        font-size: 16;
        placeholder-color: #7E8083;
    }

    .input:disabled {
        background-color: white;
        opacity: 0.5;
    }

    .btn-primary {
        margin: 20 5 15 5;
    }

    .login-label {
        horizontal-align: center;
        color: #A8A8A8;
        font-size: 16;
    }

    .sign-up-label {
        margin-bottom: 10;
    }

    .bold {
        color: $accent-dark;
        font-weight: bold;
    }

    .validation-error {
        color: darkred;
        border-top-color: darkred;
        border-top-width: 1;
    }
</style>
