<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.appearance.appearance')" :canNavigateBack="true" :canNavigateSettings="false" />
        <SettingsMenu>
            <SettingsItemSlider
                :title="'appSettings.appearance.darkMode'"
                :cssClass="'top-bordered-item'"
                v-model="currentSettings.appearance.darkMode"
                v-on:change="saveSettings"
                v-if="false"
            />
            <SettingsItemText :link="'appearanceFontSize'" :text="'appSettings.appearance.fontSize'" v-if="false" />
            <SettingsItemText :link="'appearanceLanguage'" :text="'appSettings.appearance.language'" v-if="beta" />
        </SettingsMenu>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import SharedComponents from "@/components/shared";
import SettingsItemSlider from "./SettingsItemSlider.vue";
import SettingsItemText from "./SettingsItemText.vue";
import Config from "~/config";

export default Vue.extend({
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
        },
        beta(): boolean {
            return Config.beta;
        },
    },
    components: {
        ...SharedComponents,
        SettingsItemSlider,
        SettingsItemText,
    },
    methods: {
        saveSettings() {
            this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
    },
});
</script>
