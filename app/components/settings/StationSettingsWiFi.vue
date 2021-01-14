<template>
    <Page>
        <PlatformHeader :title="_L('wifi')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
                <StackLayout class="p-t-10">
                    <StackLayout :class="station.connected ? 'm-t-5' : ''">
                        <Label
                            v-for="(option, i) in menuOptions"
                            :key="option"
                            :class="'menu-text size-18 ' + (i == menuOptions.length - 1 ? 'bottom-border' : '')"
                            :text="option"
                            textWrap="true"
                            @tap="selectFromMenu"
                        />
                    </StackLayout>
                </StackLayout>
            </ScrollView>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { AvailableStation } from "@/store";
import SharedComponents from "@/components/shared";
import Networks from "./StationSettingsNetworks.vue";
import WiFiNetwork from "./StationSettingsWiFiNetwork.vue";
import WiFiSchedule from "./StationSettingsWiFiSchedule.vue";
import * as animations from "@/components/animations";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

export default Vue.extend({
    data(): {
        menuOptions: string[];
    } {
        return {
            menuOptions: [_L("network"), _L("uploadSchedule")],
        };
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    components: {
        ...SharedComponents,
        Networks,
        WiFiNetwork,
        WiFiSchedule,
        ConnectionStatusHeader,
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        selectFromMenu(event: Event): Promise<void> {
            void animations.pressed(event);

            switch ((event as any).object.text) {
                case _L("network"):
                    this.goToNetwork();
                    break;
                case _L("uploadSchedule"):
                    this.goToSchedule();
                    break;
            }

            return Promise.resolve();
        },
        async goToNetwork(): Promise<void> {
            await this.$navigateTo(WiFiNetwork, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToSchedule(): Promise<void> {
            await this.$navigateTo(WiFiSchedule, {
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
