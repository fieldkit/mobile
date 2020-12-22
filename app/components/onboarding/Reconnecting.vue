<template>
    <Page class="page" actionBarHidden="true">
        <GridLayout rows="*,140">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*">
                    <StackLayout row="0">
                        <ScreenHeader :title="_L('connectStation')" :canNavigateSettings="false" :bottomBorder="true" @back="onBack" />
                        <Label class="title text-center m-b-20" :text="_L('reconnectToStation')" textWrap="true"></Label>

                        <Label class="instruction" :text="_L('reconnectInstruction')" lineHeight="4" textWrap="true"></Label>

                        <GridLayout rows="*" columns="*">
                            <Image width="75%" verticalAlignment="middle" src="~/images/TI_10-A.jpg"></Image>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('done')" @tap="forward"></Button>
                <Label :text="_L('skipStep')" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "../../routes";
import { _T } from "../../utilities";

export default Vue.extend({
    props: {
        deviceId: {
            type: String,
        },
    },
    data(): {} {
        return {};
    },
    methods: {
        async forward(): Promise<void> {
            await this.$navigateTo(routes.onboarding.searching, {
                clearHistory: true,
                backstackVisible: false,
                props: {
                    reconnecting: true,
                },
            });
        },
        back(): void {},
        async skip(): Promise<void> {
            await this.$navigateTo(routes.stations, { clearHistory: true });
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
</style>
