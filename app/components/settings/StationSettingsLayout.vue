<template>
    <GridLayout rows="auto,*">
        <ConnectionStatusHeader row="0" :connected="connected" />
        <ScrollView v-if="scrollable" row="1">
            <StackLayout>
                <slot></slot>
            </StackLayout>
        </ScrollView>
        <StackLayout v-else row="1">
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
        scrollable: {
            type: Boolean,
            default: true,
        },
    },
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
@import "~/_app-common";
</style>
