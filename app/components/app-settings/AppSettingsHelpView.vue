<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.help.help')" :canNavigateSettings="false" />
        <ScrollView class="m-r-20 m-l-20">
            <StackLayout>
                <SettingsItemText :link="'helpAppVersion'" :text="'appSettings.help.appVersion'" :cssClass="'top-bordered-item'" />
                <SettingsItemSlider
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

                <SettingsItemText :text="'appSettings.help.productGuide'" @tap="onProductGuide" />
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
import * as utils from "@nativescript/core/utils/utils";

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
        async saveSettings(): Promise<void> {
            await this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
        onProductGuide() {
            utils.openUrl("https://www.fieldkit.org/product-guide/set-up-station/#ready-to-deploy");
        },
    },
});
</script>
