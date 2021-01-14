<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('appSettings.help.help')" :canNavigateBack="true" :canNavigateSettings="false" />
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
import * as animations from "~/components/animations";
import routes from "@/routes";
import Promise from "bluebird";
import * as application from "@nativescript/core/application";

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
        onPageLoaded() {
            if (application.android) {
                application.android.on(application.AndroidApplication.activityBackPressedEvent, (args: any) => {
                    args.cancel = true; //this cancels the normal backbutton behaviour
                    this.$navigateTo(routes.appSettings.list, { clearHistory: true, backstackVisible: false });
                });
            }
        },
        saveSettings() {
            this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
        goBack(ev) {
            return Promise.all([animations.pressed(ev), this.$navigateTo(routes.appSettings.list, { clearHistory: true })]);
        },
    },
});
</script>
