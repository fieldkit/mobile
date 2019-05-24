<template>
    <Page actionBarHidden="true">
        <FlexboxLayout class="page">
            <StackLayout class="form">
                <Image class="logo" src="~/images/logo.png"></Image>

                <GridLayout rows="auto, auto, auto, auto">
                    <StackLayout row="0" v-show="!isLoggingIn" class="input-field">
                        <TextField class="input" hint="Name" :isEnabled="!processing"
                            keyboardType="name" autocorrect="false"
                            autocapitalizationType="none" v-model="user.name"
                            returnKeyType="next" @returnPress="focusPassword"></TextField>
                        <StackLayout class="hr-light"></StackLayout>
                    </StackLayout>

                    <StackLayout row="1" class="input-field">
                        <TextField class="input" hint="Email" :isEnabled="!processing"
                            keyboardType="email" autocorrect="false"
                            autocapitalizationType="none" v-model="user.email"
                            returnKeyType="next" @returnPress="focusPassword"></TextField>
                        <StackLayout class="hr-light"></StackLayout>
                    </StackLayout>

                    <StackLayout row="2" class="input-field">
                        <TextField class="input" ref="password" :isEnabled="!processing"
                            hint="Password" secure="true" v-model="user.password"
                            :returnKeyType="isLoggingIn ? 'done' : 'next'"
                            @returnPress="focusConfirmPassword"></TextField>
                        <StackLayout class="hr-light"></StackLayout>
                    </StackLayout>

                    <StackLayout row="3" v-show="!isLoggingIn" class="input-field">
                        <TextField class="input" ref="confirmPassword" :isEnabled="!processing"
                            hint="Confirm password" secure="true" v-model="user.confirmPassword"
                            returnKeyType="done"></TextField>
                        <StackLayout class="hr-light"></StackLayout>
                    </StackLayout>

                    <ActivityIndicator rowSpan="4" :busy="processing"></ActivityIndicator>
                </GridLayout>

                <Button :text="isLoggingIn ? _L('logIn') : _L('signUp')" :isEnabled="!processing"
                    @tap="submit" class="btn btn-primary m-t-20"></Button>
                <Label *v-show="isLoggingIn" :text="_L('forgotLink')"
                    class="login-label" @tap="forgotPassword()"></Label>
            </StackLayout>

            <Label class="login-label sign-up-label" @tap="toggleForm">
                <FormattedString>
                    <Span :text="isLoggingIn ? _L('needAccount') : _L('backToLogin')"></Span>
                    <Span :text="isLoggingIn ? _L('signUp') : ''" class="bold"></Span>
                </FormattedString>
            </Label>
        </FlexboxLayout>
    </Page>
</template>

<script>
    import Home from "./Home";

    export default {
        data() {
            return {
                isLoggingIn: true,
                processing: false,
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
</style>
