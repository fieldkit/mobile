<template>
    <ActionBar backgroundColor="white">
        <ScreenHeader
            :title="title"
            :subtitle="subtitle"
            :onBack="onBack"
            :onCancel="onCancel"
            :onSettings="onSettings"
            :canNavigateBack="canNavigateBack"
            :canNavigateSettings="canNavigateSettings"
            :bottomMargin="bottomMargin"
        />
    </ActionBar>
</template>
<script lang="ts">
import Vue from "vue";

import ScreenHeader from "./ScreenHeader.vue";

export default Vue.extend({
    name: "PlatformHeader",
    components: {
        ScreenHeader,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        subtitle: {
            type: String,
            default: null,
        },
        onBack: {
            type: Function,
            default: () => {},
        },
        onCancel: {
            type: Function,
            default: () => {},
        },
        onSettings: {
            type: Function,
            default: () => {},
        },
        canCancel: {
            type: Boolean,
            default: false,
        },
        canNavigateBack: {
            type: Boolean,
            default: true,
        },
        canNavigateSettings: {
            type: Boolean,
            default: true,
        },
        bottomMargin: {
            type: Boolean,
            default: true,
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
