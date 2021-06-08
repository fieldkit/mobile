<template>
    <StackLayout verticalAlignment="top"></StackLayout>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { debug } from "@/lib/debugging";

export default Vue.extend({
    data(): {} {
        return {};
    },
    props: {},
    mounted(): void {
        debug.log("mounted!");
    },
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
