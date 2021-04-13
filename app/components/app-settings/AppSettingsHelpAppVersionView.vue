<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.help.appVersion')" :canNavigateSettings="false" />
        <ScrollView class="m-r-20 m-l-20">
            <StackLayout>
                <StackLayout class="top-bordered-item bottom-bordered-item" @tap="openGit">
                    <Label :text="_L('appSettings.help.version')" class="size-16 m-2 m-t-15" />
                    <StackLayout orientation="horizontal">
                        <Label :text="versions.version" class="size-12 m-2 m-t-0 field-value" />
                    </StackLayout>
                    <Label :text="_L('appSettings.help.updatesTitle')" class="size-16 m-2 m-t-30" />
                    <Label :text="_L('appSettings.help.updatesDescription')" class="size-12 m-2 m-t-0 m-b-15" textWrap="true" />
                </StackLayout>
                <SettingsItemSlider
                    v-if="false"
                    :title="'appSettings.help.downloadUpdatesTitle'"
                    :description="'appSettings.help.downloadUpdatesDescription'"
                    v-model="currentSettings.help.downloadUpdates"
                    v-on:change="saveSettings"
                />
            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { Dialogs } from "@nativescript/core";
import { ActionTypes } from "@/store/actions";
import SharedComponents from "@/components/shared";
import SettingsItemSlider from "./SettingsItemSlider.vue";
import SettingsItemText from "./SettingsItemText.vue";
import { Build } from "@/config";
import * as appVersion from "nativescript-appversion";
import * as utils from "@nativescript/core/utils/utils";

export default Vue.extend({
    data(): {
        versions: typeof Build;
        storeVersion: string | null;
    } {
        return {
            versions: Build,
            storeVersion: null,
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
    async mounted(): Promise<void> {
        const versionName = await appVersion.getVersionName();
        const versionCode = await appVersion.getVersionCode();
        const appId = await appVersion.getAppId();
        console.log(`versions: ${versionName} ${versionCode} ${appId}`);
        console.log(`versions: ${JSON.stringify(Build)}`);
        this.storeVersion = versionName;
    },
    methods: {
        async saveSettings(): Promise<void> {
            await this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
        async openGit(): Promise<void> {
            return Dialogs.confirm({
                title: "Open GitHub in browser?",
                okButtonText: _L("yes"),
                cancelButtonText: _L("no"),
            }).then((yesNo) => {
                if (yesNo) {
                    console.log(`https://github.com/fieldkit/mobile/commit/${Build.gitHash}`);
                    utils.openUrl(`https://github.com/fieldkit/mobile/commit/${Build.gitHash}`);
                }
            });
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

.field-value {
    font-weight: bold;
}
</style>
