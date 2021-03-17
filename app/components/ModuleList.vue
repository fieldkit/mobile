<template>
    <StackLayout class="m-t-5 m-b-10 m-l-10 m-r-10">
        <GridLayout v-for="module in station.modules" :key="module.id" rows="auto" columns="*">
            <template v-if="!module.internal">
                <ModuleItem :station="station" :module="module"></ModuleItem>
            </template>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { LegacyStation } from "@/store";
import ModuleItem from "~/components/ModuleItem.vue";

export default Vue.extend({
    name: "ModuleListView",
    props: {
        station: {
            type: Object as () => LegacyStation,
            required: true,
        },
    },
    components: {
        ModuleItem,
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
