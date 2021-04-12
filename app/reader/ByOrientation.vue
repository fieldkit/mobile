<template>
    <GridLayout rows="*">
        <slot :name="orientation" row="0"></slot>
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
import { Screen } from "@nativescript/core";
import { getBus } from "@/components/NavigationBus";

function isLandscape(): boolean {
    return Screen.mainScreen.widthDIPs > Screen.mainScreen.heightDIPs;
}

function getOrientation(): string {
    console.log(`by-orientation:`, isLandscape() ? "landscape" : "portrait", Screen.mainScreen.widthDIPs, Screen.mainScreen.heightDIPs);
    return isLandscape() ? "landscape" : "portrait";
}

export default Vue.extend({
    name: "ByOrientation",
    data(): { orientation: string } {
        return {
            orientation: getOrientation(),
        };
    },
    computed: {},
    mounted() {
        // eslint-disable-next-line
        getBus().$on("orientation:change", this.onChange);
    },
    destroyed() {
        // eslint-disable-next-line
        getBus().$off("orientation:change", this.onChange);
    },
    methods: {
        onChange(orientation: string): void {
            console.log("orientation:change", orientation);
            this.orientation = orientation;
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
