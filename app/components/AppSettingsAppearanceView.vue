<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.help.help')" :canNavigateBack="true" :canNavigateSettings="false" />
        <ScrollView row="0" class="m-r-20 m-l-20">
            <StackLayout>
                <SettingsItemText
                    :link="'appearanceFontSize'"
                    :text="'appSettings.appearance.fontSize'"
                    :cssClass="'top-bordered-item'"
                    v-if="false"
                />
                <SettingsItemText :link="'appearanceLanguage'" :text="'appSettings.appearance.language'" v-if="false" />
                <SettingsItemSlider
                    :title="'appSettings.appearance.darkMode'"
                    v-model="currentSettings.appearance.dark_mode"
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
