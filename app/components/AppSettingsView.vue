<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.title')" :canNavigateBack="false" :canNavigateSettings="false" />
        <ScrollView row="0">
            <StackLayout>
                <SettingsItemIconText
                    :link="'data'"
                    :text="'appSettings.data.data'"
                    :imageSrc="'~/images/icon_connections.png'"
                    :cssClass="'top-bordered-item'"
                />
                <SettingsItemIconText
                    :link="'notifications'"
                    :text="'appSettings.notifications.notifications'"
                    :imageSrc="'~/images/icon_settings_notifications.png'"
                />
                <SettingsItemIconText
                    :link="'units'"
                    :text="'appSettings.units.units'"
                    :imageSrc="'~/images/icons_units.png'"
                    v-if="false"
                />
                <SettingsItemIconText
                    :link="'permissions'"
                    :text="'appSettings.permissions.permissions'"
                    :imageSrc="'~/images/icon_permissions.png'"
                />
                <SettingsItemIconText
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
                    :imageSrc="'~/images/icon_legal_settings.png'"
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
    components: {
        ...SharedComponents,
        SettingsItemIconText,
    },
});
</script>
