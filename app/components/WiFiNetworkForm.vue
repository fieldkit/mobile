<template>
    <StackLayout>
        <StackLayout class="m-t-20">
            <LabeledTextField v-model="form.ssid" :label="_L('networkNameHint')" @blur="checkSsid" />
            <Label v-show="v.ssid.required" class="validation-error" horizontalAlignment="left" :text="_L('required')" textWrap="true" />
            <LabeledTextField
                v-model="form.password"
                :label="_L('networkPasswordHint')"
                :secure="true"
                :canShow="true"
                @blur="checkPassword"
            />
            <Label
                v-show="v.password.required"
                class="validation-error"
                horizontalAlignment="left"
                :text="_L('required')"
                textWrap="true"
            />
        </StackLayout>

        <Button class="btn btn-primary btn-padded" :text="_L('save')" :isEnabled="enabled" @tap="addNetwork" />
    </StackLayout>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import LabeledTextField from "./LabeledTextField.vue";

export default Vue.extend({
    name: "WiFiNetworkForm",
    components: {
        LabeledTextField,
    },
    props: {
        enabled: {
            type: Boolean,
            default: true,
        },
    },
    data(): {
        form: {
            ssid: string;
            password: string;
        };
        v: {
            ssid: {
                required: boolean;
            };
            password: {
                required: boolean;
            };
        };
    } {
        return {
            form: {
                ssid: "",
                password: "",
            },
            v: {
                ssid: {
                    required: false,
                },
                password: {
                    required: false,
                },
            },
        };
    },
    methods: {
        checkSsid(): void {
            this.v.ssid.required = this.form.ssid.length == 0;
            console.log(`check ssid ${JSON.stringify(this.v)}`);
        },
        checkPassword(): void {
            this.v.password.required = this.form.password.length == 0;
            console.log(`check password ${JSON.stringify(this.v)}`);
        },
        addNetwork(): void {
            this.checkSsid();
            this.checkPassword();
            if (this.v.ssid.required || this.v.password.required) {
                return;
            }

            console.log(`saved: ${JSON.stringify(this.form)}`);
            this.$emit("saved", _.cloneDeep(this.form));
            this.form = {
                ssid: "",
                password: "",
            };
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.validation-error {
    color: $fk-tertiary-red;
    padding-top: 5;
}
</style>
