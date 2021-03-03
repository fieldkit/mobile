<template>
    <Page class="page">
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />
        <GridLayout rows="*,140">
            <ScrollView row="0">
                <StackLayout>
                    <ConnectionStatusHeader :connected="currentStation.connected" />
                    <Label class="m-t-20 m-l-20 m-r-20 m-b-10 text-center bold" :text="_L('dataSyncStationTitle')" textWrap="true"></Label>
                    <Label class="m-20 text-center" :text="_L('dataSyncStationInfo')" lineHeight="4" textWrap="true"></Label>
                    <SettingsItemSlider
                        :title="'appSettings.data.autoSyncStationTitle'"
                        :description="'appSettings.data.autoSyncStationDescription'"
                        :cssClass="'top-bordered-item'"
                        class="m-l-20 m-r-20 m-t-30"
                        v-model="currentSettings.data.autoSyncStation"
                        v-on:change="saveSettings"
                    />
                    <SettingsItemSlider
                        :title="'appSettings.data.mobileDataUsageTitle'"
                        :description="'appSettings.data.mobileDataUsageDescription'"
                        class="m-l-20 m-r-20"
                        v-model="currentSettings.data.mobileDataUsage"
                        v-on:change="saveSettings"
                    />
                </StackLayout>
            </ScrollView>
            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-5 m-b-25">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('next')" @tap="forward" :isEnabled="currentStation.connected" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";
import SettingsItemIconText from "~/components/app-settings/SettingsItemIconText.vue";
import SettingsItemSlider from "~/components/app-settings/SettingsItemSlider.vue";
import { routes } from "@/routes";
import { ActionTypes, LegacyStation } from "@/store";

export default Vue.extend({
    components: {
        ...SharedComponents,
        SettingsItemSlider,
        SettingsItemIconText,
        ConnectionStatusHeader,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        remote: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
        },
        currentStation(): LegacyStation {
            const station = this.$s.getters.legacyStations[this.stationId];
            if (!station) throw new Error("no station");
            return station;
        },
    },
    methods: {
        saveSettings(): void {
            this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
        async forward(): Promise<void> {
            await this.$navigateTo(routes.onboarding.completeSettings, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async onBack(): Promise<void> {
            await this.$navigateTo(routes.onboarding.network, {
                props: {
                    stationId: this.stationId,
                    remote: this.remote,
                },
            });
        },
    },
});
</script>
