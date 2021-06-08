<template>
    <Page class="page" actionBarHidden="true">
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />

        <SkipLayout :buttonLabel="_L('next')" :buttonEnabled="true" @button="forward">
            <GridLayout rows="5*,4*" columns="*">
                <Image row="0" src="~/images/Icon_Success.png" class="small"></Image>
                <Label row="1" class="instruction" :text="_L('completeSettings')" lineHeight="4" textWrap="true"></Label>
            </GridLayout>
        </SkipLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { routes } from "@/routes";

export default Vue.extend({
    name: "CompleteSettings",
    components: {
        ...SharedComponents,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data(): {} {
        return {};
    },
    methods: {
        async forward(): Promise<void> {
            await this.$deprecatedNavigateTo(routes.onboarding.recalibrate, {
                props: {
                    stationId: this.stationId,
                    bookmark: true,
                },
            });
        },
        async onBack(): Promise<void> {
            await this.$deprecatedNavigateTo(routes.onboarding.dataSync, {
                props: {
                    stationId: this.stationId,
                },
            });
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
.small {
    width: 50;
    margin: 20;
}
</style>
