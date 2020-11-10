<template>
    <Page class="page" actionBarHidden="true">
        <GridLayout rows="75,*,55">
            <ScreenHeader row="0" :title="_L('appSettings.notifications.notifications')" :canNavigateBack="true" :canNavigateSettings="false" :onBack="goBack" class="m-t-10 m-r-20 m-l-20"/>
            <ScrollView row="1" class="m-r-20 m-l-20">
                <StackLayout>
                    <SettingsItemSlider
                        :title="'appSettings.notifications.pushNotificationsTitle'"
                        :description="'appSettings.notifications.pushNotificationsDescription'"
                        :cssClass="'top-bordered-item'"
                        v-model="currentSettings.notifications.push_notifications"
                        v-on:change="saveSettings"
                    >
                    </SettingsItemSlider>
                    <SettingsItemText
                        :text="'appSettings.lorem'">
                    </SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.lorem'">
                    </SettingsItemText>
                    <SettingsItemText
                        :text="'appSettings.lorem'">
                    </SettingsItemText>
                </StackLayout>
            </ScrollView>
            <ScreenFooter row="2" active="settings"/>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
    import Vue from "vue";

    import { ActionTypes } from "@/store/actions";
    import ScreenHeader from "./ScreenHeader.vue";
    import ScreenFooter from "./ScreenFooter.vue";
    import SettingsItemSlider from "./SettingsItemSlider.vue";
    import SettingsItemText from "./SettingsItemText.vue";
    import * as animations from "~/components/animations";
    import routes from "@/routes";
    import Promise from "bluebird";

    export default Vue.extend({
        computed: {
            currentSettings(this: any) {
                return this.$s.state.portal.settings;
            },
        },
        components: {
            ScreenHeader,
            ScreenFooter,
            SettingsItemSlider,
            SettingsItemText,
        },
        methods: {
            saveSettings() {
                this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
            },
            goBack(this: any, ev) {
                return Promise.all([
                    animations.pressed(ev),
                    this.$navigateTo(routes.appSettings.list, {}),
                ]);
            },
        }
    });
</script>
