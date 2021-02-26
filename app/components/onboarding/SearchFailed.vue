<template>
    <Page actionBarHidden="true">
        <GridLayout rows="*,170">
            <ScrollView row="0">
                <GridLayout rows="auto" columns="*" verticalAlignment="middle">
                    <StackLayout row="0" verticalAlignment="middle">
                        <GridLayout rows="*" columns="*">
                            <StackLayout row="0" verticalAlignment="middle">
                                <Image width="60" class="m-b-20" src="~/images/Icon_Soft_error.png" />
                                <Label class="title m-t-20 m-b-10 text-center" :text="_L('havingProblems')" textWrap="true"></Label>

                                <Label class="instruction" :text="_L('problemStep1')" lineHeight="4" textWrap="true"></Label>
                                <Label class="instruction" :text="_L('problemStep2')" lineHeight="4" textWrap="true"></Label>
                                <Label class="instruction" :text="_L('problemStep3')" lineHeight="4" textWrap="true"></Label>
                            </StackLayout>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout row="1" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('tryAgain')" @tap="forward"></Button>
                <Button class="btn btn-secondary" :text="_L('getHelp')" @tap="getHelp"></Button>
                <Label :text="_L('skipStep')" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import routes from "../../routes";

export default Vue.extend({
    components: {
        ...SharedComponents,
    },
    props: {
        reconnecting: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        async forward(): Promise<void> {
            await this.$navigateTo(routes.onboarding.searching, {});
        },
        async skip(): Promise<void> {
            await this.$navigateTo(routes.tabbed, {
                frame: "outer-frame",
                clearHistory: true,
            });
        },
        getHelp() {
            const utilsModule = require("tns-core-modules/utils/utils");
            utilsModule.openUrl("https://www.fieldkit.org/product-guide/troubleshooting/");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.skip {
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
    font-size: 14;
    font-weight: bold;
    text-align: center;
    margin: 10;
}
.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}
.option-container {
    margin-top: 30;
    margin-left: 30;
    margin-right: 30;
}
.radio-info {
    color: $fk-gray-hint;
    margin-top: 10;
    margin-bottom: 20;
    margin-left: 35;
}
.input {
    width: 90%;
    margin-left: 20;
    margin-right: 20;
    border-bottom-width: 1px;
    text-align: center;
}
.small {
    width: 50;
    margin: 20;
}

.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.gray-text {
    color: $fk-gray-hint;
}
.red-text {
    color: $fk-primary-red;
}
.btn-secondary {
    font-size: 18;
    text-transform: none;
    font-family: "Avenir LT Pro", "AvenirLTPro-Heavy";
    font-weight: bold;
    border-color: $fk-primary-red;
    border-width: 1;
    background-color: white;
    padding: 0;
}
</style>
