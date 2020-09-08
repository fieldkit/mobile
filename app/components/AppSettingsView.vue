<template>
    <Page>
	<PlatformHeader :title="_L('appSettings.title')" :canNavigateBack="false" :canNavigateSettings="false" />
        <GridLayout rows="*,55">
            <ScrollView row="0" class="m-r-20 m-l-20">
                <StackLayout>
                    <SettingsItemIconText
                        :link="'data'"
                        :text="'appSettings.data.data'"
                        :imageSrc="'~/images/icon_connections.png'"
                        :cssClass="'top-bordered-item'">
                    </SettingsItemIconText>
                    <SettingsItemIconText
                        :link="'notifications'"
                        :text="'appSettings.notifications.notifications'"
                        :imageSrc="'~/images/icon_settings_notifications.png'">
                    </SettingsItemIconText>
                    <SettingsItemIconText
                        :link="'units'"
                        :text="'appSettings.units.units'"
                        :imageSrc="'~/images/icons_units.png'">
                    </SettingsItemIconText>
                    <SettingsItemIconText
                        :link="'permissions'"
                        :text="'appSettings.permissions.permissions'"
                        :imageSrc="'~/images/icon_permissions.png'">
                    </SettingsItemIconText>
                    <SettingsItemIconText
                        :text="'appSettings.appearance'"
                        :imageSrc="'~/images/icon_lightmode_settings.png'">
                    </SettingsItemIconText>
                    <SettingsItemIconText
                        :text="'appSettings.account'"
                        :imageSrc="'~/images/icon_account_settings.png'">
                    </SettingsItemIconText>
                    <SettingsItemIconText
                        :link="'help'"
                        :text="'appSettings.help.help'"
                        :imageSrc="'~/images/icon_help_settings.png'">
                    </SettingsItemIconText>
                    <SettingsItemIconText
                        :link="'legal'"
                        :text="'appSettings.legal.legal'"
                        :imageSrc="'~/images/icon_legal_settings.png'">
                    </SettingsItemIconText>
                </StackLayout>
            </ScrollView>
            <ScreenFooter row="1" active="settings"/>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";

import SharedComponents from "@/components/shared";
import SettingsItemIconText from "./SettingsItemIconText.vue";

export default Vue.extend({
    components: {
	...SharedComponents,
        SettingsItemIconText
    }
});
</script>
