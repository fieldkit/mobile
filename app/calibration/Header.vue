<template>
    <PlatformHeader :title="title" :subtitle="subtitle" :icon="icon" :onBack="back" :canNavigateSettings="false" />
</template>

<script lang="ts">
import Vue from "vue";
import PlatformHeader from "@/components/PlatformHeader";

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
    },
    methods: {
        back(): void {
            this.$emit("back");
        },
    },
});
</script>
