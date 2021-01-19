<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.notifications.notifications')" :canNavigateBack="true" :canNavigateSettings="false" />
        <ScrollView class="m-r-20 m-l-20">
            <StackLayout>
                <SettingsItemSlider
                    :title="'appSettings.notifications.pushNotificationsTitle'"
                    :description="'appSettings.notifications.pushNotificationsDescription'"
                    :cssClass="'top-bordered-item'"
                    v-model="currentSettings.notifications.push_notifications"
                    v-on:change="saveSettings"
                />
                <SettingsItemText :text="'appSettings.lorem'" />
                <SettingsItemText :text="'appSettings.lorem'" />
                <SettingsItemText :text="'appSettings.lorem'" />
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
        saveSettings() {
            this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
    },
});
</script>
