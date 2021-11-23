<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.help.help')" :canNavigateSettings="false" />
        <SettingsLayout>
            <SettingsItemText :link="'helpAppVersion'" :text="'appSettings.help.appVersion'" :cssClass="'top-bordered-item'" />
            <SettingsItemSlider
                v-if="false"
                :title="'appSettings.help.crashReports'"
                v-model="currentSettings.help.crashReports"
                v-on:change="saveSettings"
            />
            <SettingsItemSlider
                :title="'appSettings.help.tutorialGuide'"
                :enabled="true"
                v-model="currentSettings.help.tutorialGuide"
                v-on:change="saveSettings"
            />

            <SettingsItemText :text="'appSettings.help.preDeploymentChecklist'" @tap="onProductGuide" />
        </SettingsLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import * as utils from "@nativescript/core/utils/utils";
import SharedComponents from "@/components/shared";

export default Vue.extend({
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
        },
    },
    components: {
        ...SharedComponents,
    },
    methods: {
        async saveSettings(): Promise<void> {
            await this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
        onProductGuide() {
            utils.openUrl("https://www.fieldkit.org/product-guide/set-up-station/#ready-to-deploy");
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
