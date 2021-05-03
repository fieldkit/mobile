<template>
    <Page>
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />

        <SkipLayout
            :buttonLabel="_L('tryAgain')"
            @button="forward"
            :skipLabel="_L('skipStep')"
            @skip="skip"
            :helpLabel="_L('getHelp')"
            @help="getHelp"
            :scrolling="true"
        >
            <Image width="60" class="m-b-20" src="~/images/Icon_Soft_error.png" />
            <Label class="title m-t-20 m-b-10 text-center" :text="_L('havingProblems')" textWrap="true"></Label>

            <Label class="instruction" :text="_L('problemStep1')" lineHeight="4" textWrap="true"></Label>
            <Label class="instruction" :text="_L('problemStep2')" lineHeight="4" textWrap="true"></Label>
            <Label class="instruction" :text="_L('problemStep3')" lineHeight="4" textWrap="true"></Label>
        </SkipLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { routes, fullRoutes } from "@/routes";
import * as utils from "@nativescript/core/utils/utils";

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
            await this.$navigateTo(fullRoutes.tabbed);
        },
        getHelp() {
            utils.openUrl("https://www.fieldkit.org/product-guide/troubleshooting/");
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
