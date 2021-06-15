<template>
    <Page actionBarHidden="true" @loaded="onPageLoaded">
        <Label text="Blank" />
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { debug } from "@/lib";

export default Vue.extend({
    name: "Blank",
    props: {
        name: {
            type: String,
            default: "unknown",
        },
    },
    mounted() {
        debug.log(`blank mounted: ${this.name}`);
    },
    methods: {
        onPageLoaded() {
            debug.log(`blank loaded: ${this.name}`);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
