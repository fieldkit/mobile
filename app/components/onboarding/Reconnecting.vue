<template>
    <Page>
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />

        <SkipLayout row="1" :buttonLabel="_L('done')" @button="forward" :skipLabel="_L('skipStep')" @skip="skip" :scrollable="true">
            <Label class="title text-center m-b-20" :text="_L('reconnectToStation')" textWrap="true"></Label>

            <Label class="instruction" :text="_L('reconnectInstruction')" lineHeight="4" textWrap="true"></Label>

            <GridLayout rows="*" columns="*">
                <Image width="75%" verticalAlignment="middle" src="~/images/TI_10-A.jpg"></Image>
            </GridLayout>
        </SkipLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { routes, fullRoutes } from "@/routes";

export default Vue.extend({
    components: {
        ...SharedComponents,
    },
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
            await this.$navigateTo(fullRoutes.stations);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}
</style>
