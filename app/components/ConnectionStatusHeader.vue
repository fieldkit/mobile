<template>
    <StackLayout class="text-center disconnect-warning" v-if="!connected">
        <Label :text="_L('stationDisconnected')" />
    </StackLayout>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    data() {
        return {};
    },
    props: {
        connected: {
            required: true,
            type: Boolean,
        },
    },
    methods: {},
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.disconnect-warning {
    padding-top: 10;
    color: $fk-primary-black;
    font-size: 16;
    background-color: #fddb7a;
    height: 40;
}
</style>
