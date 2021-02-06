<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.data.data')" :canNavigateBack="true" :canNavigateSettings="false" />
        <ScrollView class="m-r-20 m-l-20">
            <StackLayout>
                <SettingsItemSlider
                    :title="'appSettings.data.autoSyncStationTitle'"
                    :description="'appSettings.data.autoSyncStationDescription'"
                    :cssClass="'top-bordered-item'"
                    v-model="currentSettings.data.autoSyncStation"
                    v-on:change="saveSettings"
                />
                <SettingsItemSlider
                    :title="'appSettings.data.autoSyncPortalTitle'"
                    :description="'appSettings.data.autoSyncPortalDescription'"
                    v-model="currentSettings.data.autoSyncPortal"
                    v-on:change="saveSettings"
                />
                <SettingsItemSlider
                    :title="'appSettings.data.mobileDataUsageTitle'"
                    :description="'appSettings.data.mobileDataUsageDescription'"
                    v-model="currentSettings.data.mobileDataUsage"
                    v-on:change="saveSettings"
                />
            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import SharedComponents from "@/components/shared";
import SettingsItemSlider from "./SettingsItemSlider.vue";
import SettingsItemIconText from "./SettingsItemIconText.vue";

export default Vue.extend({
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
        },
    },
    components: {
        ...SharedComponents,
        SettingsItemSlider,
        SettingsItemIconText,
    },
    methods: {
        saveSettings() {
            this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
    },
});
</script>
