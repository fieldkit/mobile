<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.legal.legal')" :canNavigateBack="true" :canNavigateSettings="false" />
        <ScrollView class="m-r-20 m-l-20">
            <StackLayout>
                <SettingsItemText :text="'appSettings.legal.termsOfService'" :cssClass="'top-bordered-item'" @tap="onTermsOfService" />
                <SettingsItemText :text="'appSettings.legal.privacyPolicy'" @tap="onPrivacyPolicy" />
                <SettingsItemText :text="'appSettings.legal.dataPolicy'" v-if="false" />
                <SettingsItemText :text="'appSettings.legal.licenses'" @tap="onLicenses" />
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
        currentSettings() {
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
        onTermsOfService() {
            utils.openUrl("https://www.fieldkit.org/terms-and-conditions/");
        },
        onPrivacyPolicy() {
            utils.openUrl("https://www.fieldkit.org/privacy-policy/");
        },
        onLicenses() {
            utils.openUrl("https://www.fieldkit.org/licenses");
        },
    },
});
</script>
