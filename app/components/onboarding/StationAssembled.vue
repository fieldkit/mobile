<template>
    <Page actionBarHidden="true">
        <StackLayout verticalAlignment="middle">
            <GridLayout rows="auto,auto">
                <Image row="0" src="~/images/Icon_Success.png" class="small" stretch="aspectFit" />
                <Label row="1" class="instruction" :text="_L('onboarding.assembled.message')" lineHeight="4" textWrap="true" />
            </GridLayout>
        </StackLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { routes } from "@/routes";
import { promiseAfter } from "@/lib";

export default Vue.extend({
    async mounted(): Promise<void> {
        /* eslint-disable */
        await promiseAfter(3000);
        await this.$navigateTo(routes.onboarding.start, {});
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.small {
    width: 50;
    margin: 20;
}

.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}
</style>
