<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="75,*,55">
            <ScreenHeader
                row="0"
                :title="_L('appSettings.legal.legal')"
                :canNavigateBack="true"
                :canNavigateSettings="false"
                :onBack="goBack"
                class="m-t-10 m-r-20 m-l-20"
            />
            <ScrollView row="1" class="m-r-20 m-l-20">
                <StackLayout>
                    <SettingsItemText :text="'appSettings.legal.termsOfService'" :cssClass="'top-bordered-item'"></SettingsItemText>
                    <SettingsItemText :text="'appSettings.legal.privacyPolicy'"></SettingsItemText>
                    <SettingsItemText :text="'appSettings.legal.dataPolicy'"></SettingsItemText>
                    <SettingsItemText :text="'appSettings.legal.licenses'"></SettingsItemText>
                </StackLayout>
            </ScrollView>
            <ScreenFooter row="2" active="settings" />
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";

import { ActionTypes } from "@/store/actions";
import ScreenHeader from "./ScreenHeader.vue";
import ScreenFooter from "./ScreenFooter.vue";
import SettingsItemSlider from "./SettingsItemSlider.vue";
import SettingsItemText from "./SettingsItemText.vue";
import * as animations from "~/components/animations";
import routes from "@/routes";
import Promise from "bluebird";
import * as application from "@nativescript/core/application";

export default Vue.extend({
    computed: {
        currentSettings() {
            return this.$s.state.portal.settings;
        },
    },
    components: {
        ScreenHeader,
        ScreenFooter,
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
