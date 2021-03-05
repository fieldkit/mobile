<template>
    <GridLayout rows="auto,30,60,auto" columns="*" class="m-10 text-center bordered-container p-b-20">
        <Image row="0" src="~/images/Icon_Warning_error.png" class="small"></Image>
        <Label row="1" :text="_L('noModulesAttachedTitle')" class="size-18 bold"></Label>
        <Label row="2" :text="_L('noModulesAttachedBody')" class="size-16" width="260" textWrap="true"></Label>
        <Button row="3" class="btn btn-primary btn-padded m-30" :text="_L('addModules')" :isEnabled="connected" @tap="addModules" />
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
import { routes } from "@/routes";

export default Vue.extend({
    name: "NoModulesWannaAdd",
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        connected: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        async addModules(): Promise<void> {
            // eslint-disable-next-line
            await this.$navigateTo(routes.onboarding.addModule, {
                clearHistory: true,
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

.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}

.small {
    width: 50;
    margin: 20;
}
</style>
