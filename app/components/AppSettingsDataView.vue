<template>
    <Page class="page" actionBarHidden="true">
        <GridLayout rows="75,*,55">
            <ScreenHeader row="0" :title="_L('appSettings.title')" :canNavigateBack="false" :canNavigateSettings="false" class="m-t-10 m-r-20 m-l-20"/>
            <ScrollView row="1" class="m-r-20 m-l-20">
                <StackLayout>
                    <SettingsItemSlider
                        :title="'appSettings.data.autoSyncStationTitle'"
                        :description="'appSettings.data.autoSyncStationDescription'"
                        :cssClass="'top-bordered-item'"
                        v-model="currentSettings.data.auto_sync_station"
                        v-on:change="saveSettings"
                    >
                    </SettingsItemSlider>
                    <SettingsItemSlider
                        :title="'appSettings.data.autoSyncPortalTitle'"
                        :description="'appSettings.data.autoSyncPortalDescription'"
                        v-model="currentSettings.data.auto_sync_portal"
                        v-on:change="saveSettings"
                    >
                    </SettingsItemSlider>
                    <SettingsItemSlider
                        :title="'appSettings.data.mobileDataUsageTitle'"
                        :description="'appSettings.data.mobileDataUsageDescription'"
                        v-model="currentSettings.data.mobile_data_usage"
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

    import * as ActionTypes from "@/store/actions";
    import ScreenHeader from "./ScreenHeader.vue";
    import ScreenFooter from "./ScreenFooter.vue";
    import SettingsItemSlider from "./SettingsItemSlider.vue";
    import SettingsItemText from "~/components/SettingsItemText.vue";


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
            SettingsItemText
        },
        methods: {
            saveSettings() {
                this.$store.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
            }
        }
    });
</script>
