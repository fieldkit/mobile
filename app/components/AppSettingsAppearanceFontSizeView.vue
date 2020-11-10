<template>
    <Page class="page" actionBarHidden="true">
        <GridLayout rows="75,*,55">
            <ScreenHeader
                row="0"
                :title="_L('appSettings.appearance.fontSize')"
                :canNavigateBack="true"
                :canNavigateSettings="false"
                :onBack="goBack"
                class="m-t-10 m-r-20 m-l-20"
            />
            <ScrollView row="1" class="m-r-20 m-l-20">
                <GridLayout rows="auto,*" columns="*">
                    <FlexboxLayout alignItems="stretch" flexDirection="row" height="10" :class="isAndroid ? 'm-r-15 m-l-15' : ''" row="0">
                        <Label borderColor="#d8dce0" borderRightWidth="1" borderLeftWidth="1" width="25%" />
                        <Label borderColor="#d8dce0" borderRightWidth="1" width="25%" />
                        <Label borderColor="#d8dce0" borderRightWidth="1" width="25%" />
                        <Label borderColor="#d8dce0" borderRightWidth="1" width="25%" />
                    </FlexboxLayout>
                    <Slider
                        :value="currentSettings.appearance.font_size"
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
                </GridLayout>
            </ScrollView>
            <ScreenFooter row="2" active="settings" />
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";

import { ActionTypes } from "@/store/actions";
import ScreenHeader from "./ScreenHeader.vue";
import ScreenFooter from "./ScreenFooter.vue";
import * as animations from "~/components/animations";
import routes from "@/routes";
import Promise from "bluebird";
import { isAndroid, isIOS } from "@nativescript/core";

export default Vue.extend({
    computed: {
        currentSettings(this: any) {
            return this.$s.state.portal.settings;
        },
        isAndroid() {
            return isAndroid;
        },
        isIOS() {
            return isIOS;
        },
    },
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    methods: {
        saveSettings() {
            this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
        goBack(this: any, ev) {
            return Promise.all([animations.pressed(ev), this.$navigateTo(routes.appSettings.appearance, {})]);
        },
        selectFontSize(size) {
            this.currentSettings.appearance.font_size = Math.round(size.value);
            this.saveSettings();
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
