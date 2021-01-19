<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.help.appVersion')" :canNavigateBack="true" :canNavigateSettings="false" />
        <ScrollView class="m-r-20 m-l-20">
            <StackLayout>
                <StackLayout verticalAlignment="center" backgroundColor="white" class="m-r-30 top-bordered-item bottom-bordered-item">
                    <Label :text="_L('appSettings.help.version')" class="size-16 m-2 m-t-15" />
                    <Label :text="versions.buildNumber" class="size-12 m-2 m-t-0" />
                    <Label :text="_L('appSettings.help.updatesTitle')" class="size-16 m-2 m-t-30" />
                    <Label :text="_L('appSettings.help.updatesDescription')" class="size-12 m-2 m-t-0 m-b-15" textWrap="true" />
                </StackLayout>
                <SettingsItemSlider
                    :title="'appSettings.help.downloadUpdatesTitle'"
                    :description="'appSettings.help.downloadUpdatesDescription'"
                    v-model="currentSettings.help.download_updates"
                    v-on:change="saveSettings"
                />
            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import SharedComponents from "@/components/shared";
import SettingsItemSlider from "./SettingsItemSlider.vue";
import SettingsItemText from "./SettingsItemText.vue";
import { Build } from "@/config";

export default Vue.extend({
    data(this: any) {
        return {
            versions: Build,
        };
    },
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
        },
    },
    components: {
        ...SharedComponents,
        SettingsItemSlider,
        SettingsItemText,
    },
    methods: {
        async saveSettings(): Promise<void> {
            await this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.bottom-bordered-item {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.top-bordered-item {
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}
</style>
