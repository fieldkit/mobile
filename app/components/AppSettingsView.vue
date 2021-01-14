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
                <SettingsItemIconText :link="'units'" :text="'appSettings.units.units'" :imageSrc="'~/images/icons_units.png'" />
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
            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
// import routes from "@/routes";
import SettingsItemIconText from "./SettingsItemIconText.vue";
// import * as application from "@nativescript/core/application";

export default Vue.extend({
    components: {
        ...SharedComponents,
        SettingsItemIconText,
    },
    created: function () {
        /*
        if (application.android) {
            application.android.on(application.AndroidApplication.activityBackPressedEvent, (args: any) => {
                args.cancel = true; //this cancels the normal backbutton behaviour
            });
        }
		*/
    },
});
</script>
