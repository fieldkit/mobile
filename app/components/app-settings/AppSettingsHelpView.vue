<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.help.help')" :canNavigateSettings="false" />
        <ScrollView class="m-r-20 m-l-20">
            <StackLayout>
                <SettingsItemText :link="'helpAppVersion'" :text="'appSettings.help.appVersion'" :cssClass="'top-bordered-item'" />
                <SettingsItemSlider
                    :title="'appSettings.help.crashReports'"
                    v-model="currentSettings.help.crash_reports"
                    v-on:change="saveSettings"
                />
                <SettingsItemSlider
                    :title="'appSettings.help.tutorialGuide'"
                    :enabled="true"
                    v-model="currentSettings.help.tutorial_guide"
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
import SettingsItemText from "./SettingsItemText.vue";

export default Vue.extend({
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
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
