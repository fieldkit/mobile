<template>
    <Page>
        <PlatformHeader :title="_L('networks')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*,70">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
                <StackLayout class="p-t-10">
                    <StackLayout class="m-t-5">
                        <Label
                            v-for="(option, i) in menuOptions"
                            :key="option"
                            :class="'menu-text size-18 ' + (i == menuOptions.length - 1 ? 'bottom-border' : '')"
                            :text="option"
                            textWrap="true"
                            @tap="selectFromMenu"
                        ></Label>
                    </StackLayout>
                </StackLayout>
            </ScrollView>
            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { AvailableStation } from "@/store";
import SharedComponents from "@/components/shared";
import WiFi from "./StationSettingsWiFi.vue";
import LoRa from "./StationSettingsLoRa.vue";
import * as animations from "../animations";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

export default Vue.extend({
    data() {
        return {
            menuOptions: [_L("wifi"), _L("lora")],
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
        WiFi,
        LoRa,
        ConnectionStatusHeader,
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        async selectFromMenu(ev: Event): Promise<void> {
            void animations.pressed(ev);

            switch ((ev as any).object.text) {
                case "WiFi":
                    this.goToWiFi();
                    break;
                case "LoRa":
                    this.goToLoRa();
                    break;
            }
            return Promise.resolve();
        },
        async goToWiFi(): Promise<void> {
            await this.$navigateTo(WiFi, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToLoRa(): Promise<void> {
            await this.$navigateTo(LoRa, {
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
