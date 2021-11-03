<template>
    <PlatformHeader
        :title="title"
        :subtitle="subtitle"
        :icon="icon"
        :onBack="back"
        :canNavigateSettings="false"
        :canNavigateBack="canNavigateBack"
    />
</template>

<script lang="ts">
import Vue from "vue";
import PlatformHeader from "@/components/PlatformHeader.vue";

export default Vue.extend({
    name: "Header",
    components: {
        PlatformHeader,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        subtitle: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            required: true,
        },
        canNavigateBack: {
            type: Boolean,
            default: true,
        },
    },
    methods: {
        back(): void {
            this.$emit("back");
        },
    },
});
</script>
