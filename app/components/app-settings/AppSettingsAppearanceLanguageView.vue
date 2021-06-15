<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.appearance.language')" :canNavigateBack="true" :canNavigateSettings="false" />
        <SettingsLayout>
            <StackLayout>
                <GridLayout columns="30,*" class="top-bordered-item p-t-30 p-b-10" @tap="selectLanguage('en')">
                    <CheckBox
                        row="0"
                        col="0"
                        :class="this.isIOS ? 'm-l-5' : ''"
                        :checked="this.currentSettings.appearance.language == 'en'"
                        fillColor="#2c3e50"
                        onCheckColor="#2c3e50"
                        onTintColor="#d8dce0"
                        fontSize="16"
                        boxType="circle"
                        @tap="selectLanguage('en')"
                    />
                    <Label row="0" col="1" class="size-16 m-t-5 m-l-5" :text="_L('appSettings.appearance.english')"></Label>
                </GridLayout>
                <GridLayout columns="30,*" class="p-t-10 p-b-10" @tap="selectLanguage('es')">
                    <CheckBox
                        row="0"
                        col="0"
                        :class="this.isIOS ? 'm-l-5' : ''"
                        :checked="this.currentSettings.appearance.language == 'es'"
                        fillColor="#2c3e50"
                        onCheckColor="#2c3e50"
                        onTintColor="#d8dce0"
                        fontSize="15"
                        boxType="circle"
                        @tap="selectLanguage('es')"
                    />
                    <Label row="0" col="1" class="size-16 m-t-5 m-l-5" :text="_L('appSettings.appearance.spanish')"></Label>
                </GridLayout>
                <GridLayout columns="30,*" class="p-t-10 p-b-10 p-l-1" @tap="selectLanguage('cz')">
                    <CheckBox
                        row="0"
                        col="0"
                        :class="this.isIOS ? 'm-l-5' : ''"
                        :checked="this.currentSettings.appearance.language == 'cz'"
                        fillColor="#2c3e50"
                        onCheckColor="#2c3e50"
                        onTintColor="#d8dce0"
                        fontSize="16"
                        boxType="circle"
                        @tap="selectLanguage('cz')"
                    />
                    <Label row="0" col="1" class="size-16 m-t-5 m-l-5" :text="_L('appSettings.appearance.chinese')"></Label>
                </GridLayout>
            </StackLayout>
        </SettingsLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import { isIOS } from "@nativescript/core";
import SharedComponents from "@/components/shared";

export default Vue.extend({
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
        },
        isIOS(): boolean {
            return isIOS;
        },
    },
    components: {
        ...SharedComponents,
    },
    methods: {
        async saveSettings(): Promise<void> {
            await this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
        async selectLanguage(language): Promise<void> {
            this.currentSettings.appearance.language = language;
            await this.saveSettings();
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.top-bordered-item {
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}
</style>
