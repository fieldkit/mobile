<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.title')" :canNavigateBack="false" :canNavigateSettings="false" />
        <ScrollView>
            <StackLayout>
                <SettingsItemIconText
                    v-show="false"
                    :link="'data'"
                    :text="'appSettings.data.data'"
                    :imageSrc="'~/images/icon_connections.png'"
                />
                <SettingsItemIconText
                    v-show="false"
                    :link="'notifications'"
                    :text="'appSettings.notifications.notifications'"
                    :imageSrc="'~/images/icon_settings_notifications.png'"
                />
                <SettingsItemIconText
                    v-show="false"
                    :link="'units'"
                    :text="'appSettings.units.units'"
                    :imageSrc="'~/images/icons_units.png'"
                />
                <SettingsItemIconText
                    v-show="false"
                    :link="'permissions'"
                    :text="'appSettings.permissions.permissions'"
                    :imageSrc="'~/images/icon_permissions.png'"
                />
                <SettingsItemIconText
                    v-show="false"
                    :link="'appearance'"
                    :text="'appSettings.appearance.appearance'"
                    :imageSrc="'~/images/icon_lightmode_settings.png'"
                />
                <SettingsItemIconText
                    :link="'account'"
                    :text="'appSettings.account.account'"
                    :imageSrc="'~/images/icon_account_settings.png'"
                />
                <SettingsItemIconText :link="'help'" :text="'appSettings.help.help'" :imageSrc="'~/images/icon_help_settings.png'" />
                <SettingsItemIconText :link="'legal'" :text="'appSettings.legal.legal'" :imageSrc="'~/images/icon_legal_settings.png'" />
                <SettingsItemIconText
                    :link="'developer'"
                    :text="'appSettings.developer.developer'"
                    :imageSrc="'~/images/icon_developer.png'"
                />
            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import SettingsItemIconText from "./SettingsItemIconText.vue";

export default Vue.extend({
    name: "AppSettingsView",
    components: {
        ...SharedComponents,
        SettingsItemIconText,
    },
});
</script>
