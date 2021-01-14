<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('appSettings.data.data')" :canNavigateBack="true" :canNavigateSettings="false" />
        <GridLayout rows="*,55">
            <ScrollView row="0" class="m-r-20 m-l-20">
                <StackLayout>
                    <SettingsItemSlider
                        :title="'appSettings.data.autoSyncStationTitle'"
                        :description="'appSettings.data.autoSyncStationDescription'"
                        :cssClass="'top-bordered-item'"
                        v-model="currentSettings.data.auto_sync_station"
                        v-on:change="saveSettings"
                    />
                    <SettingsItemSlider
                        :title="'appSettings.data.autoSyncPortalTitle'"
                        :description="'appSettings.data.autoSyncPortalDescription'"
                        v-model="currentSettings.data.auto_sync_portal"
                        v-on:change="saveSettings"
                    />
                    <SettingsItemSlider
                        :title="'appSettings.data.mobileDataUsageTitle'"
                        :description="'appSettings.data.mobileDataUsageDescription'"
                        v-model="currentSettings.data.mobile_data_usage"
                        v-on:change="saveSettings"
                    />
                </StackLayout>
            </ScrollView>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import SharedComponents from "@/components/shared";
import SettingsItemSlider from "./SettingsItemSlider.vue";
import SettingsItemIconText from "~/components/SettingsItemIconText.vue";
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
        SettingsItemIconText,
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
