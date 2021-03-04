<template>
    <Page class="page" actionBarHidden="true">
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />
        <GridLayout rows="*,140">
            <StackLayout row="0">
                <StackLayout height="100%" backgroundColor="white" verticalAlignment="middle">
                    <GridLayout rows="auto, auto" columns="*">
                        <Image row="0" src="~/images/Icon_Success.png" class="small"></Image>
                        <Label row="1" class="instruction" :text="_L('completeSettings')" lineHeight="4" textWrap="true"></Label>
                    </GridLayout>
                </StackLayout>
            </StackLayout>

            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-10 m-b-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('next')" @tap="forward"></Button>
            </StackLayout>
        </GridLayout>
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
            await this.$navigateTo(routes.onboarding.recalibrate, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async onBack(): Promise<void> {
            await this.$navigateTo(routes.onboarding.dataSync, {
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
