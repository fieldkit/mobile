<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.permissions.permissions')" :canNavigateBack="true" :canNavigateSettings="false" />
        <SettingsLayout>
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
        </SettingsLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import SharedComponents from "@/components/shared";

export default Vue.extend({
    computed: {
        currentSettings() {
            return this.$s.state.portal.settings;
        },
    },
    components: {
        ...SharedComponents,
    },
    methods: {
        saveSettings() {
            this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
    },
});
</script>
