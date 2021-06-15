<template>
    <Page>
        <PlatformHeader :title="_L('appSettings.appearance.fontSize')" :canNavigateBack="true" :canNavigateSettings="false" />
        <SettingsLayout>
            <FlexboxLayout alignItems="stretch" flexDirection="row" height="10" :class="isAndroid ? 'm-r-15 m-l-15' : ''" row="0">
                <Label borderColor="#d8dce0" borderRightWidth="1" borderLeftWidth="1" width="25%" />
                <Label borderColor="#d8dce0" borderRightWidth="1" width="25%" />
                <Label borderColor="#d8dce0" borderRightWidth="1" width="25%" />
                <Label borderColor="#d8dce0" borderRightWidth="1" width="25%" />
            </FlexboxLayout>
            <Slider
                :value="currentSettings.appearance.fontSize"
                minValue="0"
                maxValue="4"
                opacity="1"
                selectedBackgroundColor="#f4f5f7"
                backgroundColor="#d8dce0"
                color="#1b80c9"
                @valueChange="selectFontSize"
                row="0"
            />
            <DockLayout stretchLastChild="false" row="1">
                <Label class="size-12" dock="left" :text="_L('appSettings.appearance.tiny')"></Label>
                <Label class="size-12" dock="right" :text="_L('appSettings.appearance.huge')"></Label>
            </DockLayout>
        </SettingsLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import { isAndroid, isIOS } from "@nativescript/core";
import SharedComponents from "@/components/shared";

export default Vue.extend({
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
        },
        isAndroid(): boolean {
            return isAndroid;
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
        async selectFontSize(size): Promise<void> {
            this.currentSettings.appearance.fontSize = Math.round(size.value);
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
