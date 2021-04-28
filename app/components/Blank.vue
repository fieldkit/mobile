<template>
    <Page actionBarHidden="true" @loaded="onPageLoaded">
        <Label text="Blank" />
    </Page>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    name: "Blank",
    props: {
        name: {
            type: String,
            default: "unknown",
        },
    },
    mounted() {
        console.log(`blank mounted: ${this.name}`);
    },
    methods: {
        onPageLoaded() {
            console.log(`blank loaded: ${this.name}`);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
