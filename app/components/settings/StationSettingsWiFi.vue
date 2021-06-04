<template>
    <Page>
        <PlatformHeader :title="_L('wifi')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected">
            <SettingsItemText text="network" @tap="goToNetwork" />
            <SettingsItemText text="uploadSchedule" @tap="goToSchedule" v-if="false" />
        </StationSettingsLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { AvailableStation } from "@/store";
import SharedComponents from "@/components/shared";
import WiFiNetwork from "./StationSettingsWiFiNetwork.vue";
import WiFiSchedule from "./StationSettingsWiFiSchedule.vue";

export default Vue.extend({
    data(): {} {
        return {};
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    components: {
        ...SharedComponents,
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        async goToNetwork(): Promise<void> {
            await this.$deprecatedNavigateTo(WiFiNetwork, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToSchedule(): Promise<void> {
            await this.$deprecatedNavigateTo(WiFiSchedule, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.menu-text {
    padding-left: 5;
    padding-top: 20;
    padding-bottom: 20;
    margin-left: 10;
    margin-right: 10;
    border-color: $fk-gray-lighter;
    border-top-width: 1;
}
.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}
</style>
