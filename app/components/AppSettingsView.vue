<template>
    <Page class="page" actionBarHidden="true">
        <GridLayout rows="75,*,55">
            <ScreenHeader row="0" :title="_L('appSettings.title')" :canNavigateBack="false" :canNavigateSettings="false"
                          class="m-t-10 m-r-20 m-l-20"/>
            <ScrollView row="1" class="m-r-20 m-l-20">
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
                        :link="'appearance'"
                        :text="'appSettings.appearance.appearance'"
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
            <!-- footer -->
            <ScreenFooter row="2" active="settings"/>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";

import ScreenHeader from "./ScreenHeader.vue";
import ScreenFooter from "./ScreenFooter.vue";
import SettingsItemIconText from "./SettingsItemIconText.vue";

export default Vue.extend({
    components: {
        ScreenHeader,
        ScreenFooter,
        SettingsItemIconText
    }
});
</script>
