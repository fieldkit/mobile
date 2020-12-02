<template>
    <StackLayout class="p-20" :visibility="connected ? 'collapsed' : 'visible'">
        <Label class="size-18" lineHeight="4" horizontalAlignment="left" :text="_L('mustBeConnected')" textWrap="true"></Label>
    </StackLayout>
</template>
<script lang="ts">
import _ from "lodash";
import Vue, { PropType } from "vue";

export default Vue.extend({
    props: {
        station: {
            type: Object as PropType<{ id: number; connected: boolean }>,
            required: true,
        },
    },
    computed: {
        connected(): boolean {
            if (_.isBoolean(this.station.connected)) {
                return this.station.connected;
            }
            return false;
        },
    },
    mounted(): void {
        if (!_.isBoolean(this.station.connected)) {
            console.log(`[WARN] connection-note: ${this.station.connected} ${JSON.stringify(this.station)}`);
        }
    },
});
</script>
<style scoped lang="scss"></style>
