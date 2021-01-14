<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('appSettings.permissions.permissions')" :canNavigateBack="true" :canNavigateSettings="false" />
        <ScrollView row="0" class="m-r-20 m-l-20">
            <StackLayout>
                <SettingsItemSlider
                    :title="'appSettings.permissions.locationTitle'"
                    :cssClass="'top-bordered-item'"
                    v-model="currentSettings.permissions.location"
                    v-on:change="saveSettings"
                />
                <SettingsItemSlider
                    :title="'appSettings.permissions.filesTitle'"
                    v-model="currentSettings.permissions.files"
                    v-on:change="saveSettings"
                />
                <SettingsItemSlider
                    :title="'appSettings.permissions.cameraTitle'"
                    v-model="currentSettings.permissions.camera"
                    v-on:change="saveSettings"
                />
                <SettingsItemSlider
                    :title="'appSettings.permissions.microphoneTitle'"
                    v-model="currentSettings.permissions.microphone"
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
        ...SharedComponents,
        SettingsItemSlider,
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
