<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.title')" :canNavigateBack="false" :canNavigateSettings="false" />
        <GridLayout rows="*,55">
            <ScrollView row="0" class="m-r-20 m-l-20">
                <StackLayout>
                    <SettingsItemText
                        :link="'dataSync'"
                        :text="'appSettings.data'"
                        :imageSrc="'~/images/icon_connections.png'"
                        :cssClass="'top-bordered-item'"
                    ></SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.notifications'"
                        :imageSrc="'~/images/icon_settings_notifications.png'"
                    ></SettingsItemText>
                    <SettingsItemText :text="'appSettings.units'" :imageSrc="'~/images/icons_units.png'"></SettingsItemText>
                    <SettingsItemText :text="'appSettings.permissions'" :imageSrc="'~/images/icon_permissions.png'"></SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.appearance'"
                        :imageSrc="'~/images/icon_lightmode_settings.png'"
                    ></SettingsItemText>
                    <SettingsItemText :text="'appSettings.account'" :imageSrc="'~/images/icon_account_settings.png'"></SettingsItemText>
                    <SettingsItemText :text="'appSettings.help'" :imageSrc="'~/images/icon_help_settings.png'"></SettingsItemText>
                    <SettingsItemText :text="'appSettings.legal'" :imageSrc="'~/images/icon_legal_settings.png'"></SettingsItemText>
                </StackLayout>
            </ScrollView>
            <ScreenFooter row="1" active="settings" />
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";

import SharedComponents from "@/components/shared";
import SettingsItemText from "./SettingsItemText.vue";

export default Vue.extend({
    components: {
        ...SharedComponents,
        SettingsItemText,
    },
});
</script>
