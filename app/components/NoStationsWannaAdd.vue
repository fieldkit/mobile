<template>
    <GridLayout rows="auto,auto,auto,auto" class="m-t-20">
        <Image row="0" src="~/images/TI_8-B.jpg" v-if="image" width="50%" />
        <Label row="1" :text="_L('connectAStation')" class="m-x-10 m-t-30 m-b-10 text-center bold dark size-20" />
        <Label row="2" :text="_L('addStationInstruction')" class="text-center size-18 instruction" textWrap="true" />
        <Button row="3" class="btn btn-primary btn-padded m-y-20" :text="_L('addStation')" @tap="goToAddStation"></Button>
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
import { routes } from "@/routes";

export default Vue.extend({
    name: "NoStationsWannaAdd",
    props: {
        image: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        goToAddStation(): Promise<any> {
            // NOTE Without this weird things break after the navigation. Need to address this when we've got more time.
            return this.$navigateTo(routes.onboarding.start, {
                frame: "outer-frame",
                clearHistory: true,
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.dark {
    color: $fk-primary-black;
}
.instruction {
    color: $fk-primary-black;
    margin-left: 25;
    margin-right: 25;
    margin-bottom: 20;
    line-height: 4;
}
</style>
