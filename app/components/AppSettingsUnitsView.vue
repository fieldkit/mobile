<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="75,*,55">
            <ScreenHeader
                row="0"
                :title="_L('appSettings.units.units')"
                :canNavigateBack="true"
                :canNavigateSettings="false"
                :onBack="goBack"
                class="m-t-10 m-r-20 m-l-20"
            />
            <ScrollView row="1" class="m-r-20 m-l-20">
                <StackLayout>
                    <GridLayout rows="50" columns="*, 180" class="top-bordered-item bottom-bordered-item">
                        <Label :text="_L('appSettings.units.unitSystem')" class="size-16 m-5" col="0" verticalAlignment="center" />
                        <StackLayout
                            orientation="horizontal"
                            borderRadius="4"
                            col="1"
                            class="m-10 border"
                            verticalAlignment="center"
                            height="30"
                        >
                            <Label
                                :text="_L('appSettings.units.imperial')"
                                class="size-13 text-center p-t-3 b-right"
                                width="82"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.unit_system == 'imperial' ? 'b-active' : ''"
                                @tap="setUnitSystem('imperial')"
                            />
                            <Label
                                :text="_L('appSettings.units.metric')"
                                class="size-13 text-center p-t-3"
                                width="82"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.unit_system == 'metric' ? 'b-active' : ''"
                                @tap="setUnitSystem('metric')"
                            />
                        </StackLayout>
                    </GridLayout>
                    <GridLayout rows="85" columns="*">
                        <Label
                            :text="_L('appSettings.units.customMetricSettings')"
                            class="size-16 m-l-5 v-middle bold m-t-50 m-b-12"
                            row="0"
                        />
                    </GridLayout>
                    <GridLayout rows="50" columns="*, 180" class="top-bordered-item bottom-bordered-item">
                        <Label :text="_L('appSettings.units.temperature')" class="size-16 m-5" col="0" verticalAlignment="center" />
                        <StackLayout
                            orientation="horizontal"
                            borderRadius="4"
                            col="1"
                            class="m-10 border"
                            verticalAlignment="center"
                            height="30"
                        >
                            <Label
                                :text="'ºF'"
                                class="size-13 text-center p-t-3 b-right"
                                width="55"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.temperature == 'f' ? 'b-active' : ''"
                                @tap="setTemperature('f')"
                            />
                            <Label
                                :text="'ºC'"
                                class="size-13 text-center p-t-3 b-right"
                                width="55"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.temperature == 'c' ? 'b-active' : ''"
                                @tap="setTemperature('c')"
                            />
                            <Label
                                :text="'K'"
                                class="size-13 text-center p-t-3"
                                width="55"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.temperature == 'k' ? 'b-active' : ''"
                                @tap="setTemperature('k')"
                            />
                        </StackLayout>
                    </GridLayout>
                    <GridLayout rows="50" columns="*, 130" class="bottom-bordered-item">
                        <Label :text="_L('appSettings.units.unitName')" class="size-16 m-5" col="0" verticalAlignment="center" />
                        <StackLayout
                            orientation="horizontal"
                            borderRadius="4"
                            col="1"
                            class="m-10 border"
                            verticalAlignment="center"
                            height="30"
                        >
                            <Label
                                :text="'mg/L'"
                                class="size-13 text-center p-t-3 b-right"
                                width="55"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.unit_name == 'mgl' ? 'b-active' : ''"
                                @tap="setUnitName('mgl')"
                            />
                            <FlexboxLayout
                                v-if="isIOS"
                                flexDirection="column"
                                justifyContent="center"
                                width="55"
                                :class="currentSettings.units.unit_name == 'kgm3' ? 'b-active' : ''"
                                @tap="setUnitName('kgm3')"
                            >
                                <HtmlView
                                    class="size-13"
                                    height="15"
                                    alignSelf="center"
                                    html="<p style='text-align:center'>kg/m<sup style='font-size:10'>3</sup></p>"
                                />
                            </FlexboxLayout>
                            <Label
                                v-if="isAndroid"
                                class="size-13 text-center"
                                width="55"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.unit_name == 'kgm3' ? 'b-active' : ''"
                                @tap="setUnitName('kgm3')"
                            >
                                <FormattedString>
                                    <Span text="kg/m" class="span"></Span>
                                    <Span text="3" class="span" style="font-size: 10; vertical-align: top"></Span>
                                </FormattedString>
                            </Label>
                        </StackLayout>
                    </GridLayout>
                    <GridLayout rows="50" columns="*, 130" class="bottom-bordered-item">
                        <Label :text="_L('appSettings.units.pressure')" class="size-16 m-5" col="0" verticalAlignment="center" />
                        <StackLayout
                            orientation="horizontal"
                            borderRadius="4"
                            col="1"
                            class="m-10 border"
                            verticalAlignment="center"
                            height="30"
                        >
                            <Label
                                :text="'mBar'"
                                class="size-13 text-center p-t-3 b-right"
                                width="55"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.pressure == 'mBar' ? 'b-active' : ''"
                                @tap="setPressure('mBar')"
                            />

                            <Label
                                :text="'kPa'"
                                class="size-13 text-center p-t-3"
                                width="55"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.pressure == 'kPa' ? 'b-active' : ''"
                                @tap="setPressure('kPa')"
                            />
                        </StackLayout>
                    </GridLayout>
                    <GridLayout rows="50" columns="*, 130" class="bottom-bordered-item">
                        <Label :text="_L('appSettings.units.velocity')" class="size-16 m-5" col="0" verticalAlignment="center" />
                        <StackLayout
                            orientation="horizontal"
                            borderRadius="4"
                            col="1"
                            class="m-10 border"
                            verticalAlignment="center"
                            height="30"
                        >
                            <Label
                                :text="'mBar'"
                                class="size-13 text-center p-t-3 b-right"
                                width="55"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.velocity == 'mBar' ? 'b-active' : ''"
                                @tap="setVelocity('mBar')"
                            />
                            <Label
                                :text="'kPa'"
                                class="size-13 text-center p-t-3"
                                width="55"
                                @loaded="onLabelLoaded"
                                :class="currentSettings.units.velocity == 'kPa' ? 'b-active' : ''"
                                @tap="setVelocity('kPa')"
                            />
                        </StackLayout>
                    </GridLayout>
                </StackLayout>
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
import SettingsItemSlider from "./SettingsItemSlider.vue";
import SettingsItemText from "./SettingsItemText.vue";
import * as animations from "~/components/animations";
import routes from "@/routes";
import Promise from "bluebird";
import { isAndroid, isIOS, Label } from "@nativescript/core";
import * as application from "@nativescript/core/application";

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
        SettingsItemSlider,
        SettingsItemText,
    },
    methods: {
        onPageLoaded() {
            if (application.android) {
                application.android.on(application.AndroidApplication.activityBackPressedEvent, (args: any) => {
                    args.cancel = true; //this cancels the normal backbutton behaviour
                    this.$navigateTo(routes.appSettings.list, { clearHistory: true, backstackVisible: false });
                });
            }
        },
        saveSettings() {
            this.$s.dispatch(ActionTypes.UPDATE_SETTINGS, this.currentSettings);
        },
        goBack(ev) {
            return Promise.all([animations.pressed(ev), this.$navigateTo(routes.appSettings.list, { clearHistory: true })]);
        },
        onLabelLoaded(args) {
            const lbl = args.object as Label;
            if (isAndroid) {
                lbl.android.setGravity(17);
            }
        },
        setUnitSystem(setting) {
            if (setting == "imperial") {
                this.setImperial();
            } else {
                this.setMetric();
            }
            this.saveSettings();
        },
        setTemperature(setting) {
            this.currentSettings.units.temperature = setting;
            this.saveSettings();
        },
        setUnitName(setting) {
            this.currentSettings.units.unit_name = setting;
            this.saveSettings();
        },
        setPressure(setting) {
            this.currentSettings.units.pressure = setting;
            this.saveSettings();
        },
        setVelocity(setting) {
            this.currentSettings.units.velocity = setting;
            this.saveSettings();
        },
        setImperial() {
            this.currentSettings.units = {
                unit_system: "imperial",
                temperature: "f",
                unit_name: "mgl",
                pressure: "mBar",
                velocity: "mBar",
            };
        },
        setMetric() {
            this.currentSettings.units = {
                unit_system: "metric",
                temperature: "c",
                unit_name: "kgm3",
                pressure: "kPa",
                velocity: "kPa",
            };
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

.size-13 {
    font-size: 13;
}

.m-t-50 {
    margin-top: 50;
}

.border {
    border-width: 1;
    border-color: #d8dce0;
}

.b-right {
    border-right-width: 1;
    border-right-color: #d8dce0;
}

.b-active {
    font-weight: bold;
    background-color: #f4f5f7;
}

HtmlView,
.span {
    background-color: transparent;
}

.b-active HtmlView,
.b-active .span {
    background-color: #f4f5f7;
}

.red {
    background-color: red;
}
</style>
