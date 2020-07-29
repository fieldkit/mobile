<template>
    <StackLayout class="p-20" :visibility="station.connected ? 'collapsed' : 'visible'">
        <Label class="size-18" lineHeight="4" horizontalAlignment="left" :text="_L('mustBeConnected')" textWrap="true"></Label>
    </StackLayout>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    data() {
        return {};
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
        station: {
            required: true,
            type: Object,
        },
    },
    methods: {},
});
</script>
<style scoped lang="scss"></style>
