<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="75,*,55">
            <ScreenHeader
                row="0"
                :title="_L('appSettings.permissions.permissions')"
                :canNavigateBack="true"
                :canNavigateSettings="false"
                :onBack="goBack"
                class="m-t-10 m-r-20 m-l-20"
            />
            <ScrollView row="1" class="m-r-20 m-l-20">
                <StackLayout>
                    <SettingsItemSlider
                        :title="'appSettings.permissions.locationTitle'"
                        :cssClass="'top-bordered-item'"
                        v-model="currentSettings.permissions.location"
                        v-on:change="saveSettings"
                    ></SettingsItemSlider>
                    <SettingsItemSlider
                        :title="'appSettings.permissions.filesTitle'"
                        v-model="currentSettings.permissions.files"
                        v-on:change="saveSettings"
                    ></SettingsItemSlider>
                    <SettingsItemSlider
                        :title="'appSettings.permissions.cameraTitle'"
                        v-model="currentSettings.permissions.camera"
                        v-on:change="saveSettings"
                    ></SettingsItemSlider>
                    <SettingsItemSlider
                        :title="'appSettings.permissions.microphoneTitle'"
                        v-model="currentSettings.permissions.microphone"
                        v-on:change="saveSettings"
                    ></SettingsItemSlider>
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
