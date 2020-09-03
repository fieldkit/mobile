<template>
    <Page class="page" actionBarHidden="true">
        <GridLayout rows="75,*,55">
            <ScreenHeader row="0" :title="_L('appSettings.title')" :canNavigateBack="false" :canNavigateSettings="false" class="m-t-10 m-r-20 m-l-20"/>
            <ScrollView row="1" class="m-r-20 m-l-20">
                <StackLayout>
                    <SettingsItemText
                        :link="'data'"
                        :text="'appSettings.data.data'"
                        :imageSrc="'~/images/icon_connections.png'"
                        :cssClass="'top-bordered-item'">
                    </SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.notifications'"
                        :imageSrc="'~/images/icon_settings_notifications.png'">
                    </SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.units'"
                        :imageSrc="'~/images/icons_units.png'">
                    </SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.permissions'"
                        :imageSrc="'~/images/icon_permissions.png'">
                    </SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.appearance'"
                        :imageSrc="'~/images/icon_lightmode_settings.png'">
                    </SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.account'"
                        :imageSrc="'~/images/icon_account_settings.png'">
                    </SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.help'"
                        :imageSrc="'~/images/icon_help_settings.png'">
                    </SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.legal'"
                        :imageSrc="'~/images/icon_legal_settings.png'">
                    </SettingsItemText>
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
    import SettingsItemText from "./SettingsItemText.vue";

    export default Vue.extend({
        components: {
            ScreenHeader,
            ScreenFooter,
            SettingsItemText
        }
    });
</script>
