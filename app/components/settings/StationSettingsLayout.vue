<template>
    <GridLayout rows="auto,*">
        <ConnectionStatusHeader row="0" :connected="connected" />
        <StackLayout row="1">
            <slot></slot>
        </StackLayout>
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
import ConnectionStatusHeader from "@/components/ConnectionStatusHeader.vue";

export default Vue.extend({
    name: "StationSettingsLayout",
    components: {
        ConnectionStatusHeader,
    },
    props: {
        connected: {
            type: Boolean,
            required: true,
        },
    },
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
@import "~/_app-common";
</style>
