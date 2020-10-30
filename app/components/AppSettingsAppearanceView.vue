<template>
    <Page class="page" actionBarHidden="true">
        <GridLayout rows="75,*,55">
            <ScreenHeader row="0" :title="_L('appSettings.help.help')" :canNavigateBack="true"
                          :canNavigateSettings="false" :onBack="goBack" class="m-t-10 m-r-20 m-l-20"/>
            <ScrollView row="1" class="m-r-20 m-l-20">
                <StackLayout>
                    <SettingsItemText
                        :link="'appearanceFontSize'"
                        :text="'appSettings.appearance.fontSize'"
                        :cssClass="'top-bordered-item'">
                    </SettingsItemText>
                    <SettingsItemText
                        :link="'appearanceLanguage'"
                        :text="'appSettings.appearance.language'">
                    </SettingsItemText>
                    <SettingsItemSlider
                        :title="'appSettings.appearance.darkMode'"
                        v-model="currentSettings.appearance.dark_mode"
                        v-on:change="saveSettings"
                    >
                    </SettingsItemSlider>
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
            return this.$store.state.portal.settings;
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
            this.$store.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
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
