<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.notifications.notifications')" :canNavigateBack="true" :canNavigateSettings="false" />
        <SettingsLayout>
            <SettingsItemSlider
                :title="'appSettings.notifications.pushNotificationsTitle'"
                :description="'appSettings.notifications.pushNotificationsDescription'"
                :cssClass="'top-bordered-item'"
                v-model="currentSettings.notifications.pushNotifications"
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
