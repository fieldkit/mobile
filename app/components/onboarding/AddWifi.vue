<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,140">
            <ScrollView :row="0">
                <GridLayout rows="auto,auto,auto,auto" columns="*" @tap="hideKeyboard">
                    <ScreenHeader row="0" title="Connect Station" subtitle="Add WiFi" :canNavigateSettings="false" @back="onBack" />

                    <StackLayout row="1">
                        <Label :text="_L('wifiStep1')" textWrap="true" class="wifi-help" />
                        <Label :text="_L('wifiStep2')" textWrap="true" class="wifi-help" />
                    </StackLayout>

                    <StackLayout row="2" class="field-container">
                        <Label text="SSID" />
                        <TextField class="text-field" v-model="form.ssid" autocorrect="false" autocapitalizationType="none" />
                    </StackLayout>
                    <StackLayout row="3" class="field-container">
                        <Label text="Password" />
                        <TextField
                            class="text-field"
                            v-model="form.password"
                            autocorrect="false"
                            autocapitalizationType="none"
                            secure="true"
                        />
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('next')" :isEnabled="canAdd" @tap="addNetwork"></Button>
                <Label :text="_L('skipStep')" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "@/routes";
import { _T } from "@/utilities";
import * as ActionTypes from "@/store/actions";
import { AddStationNetworkAction } from "@/store";
import ScreenHeader from "../ScreenHeader.vue";
import * as utils from "tns-core-modules/utils/utils";
import { isAndroid } from "tns-core-modules/platform";

export default Vue.extend({
    name: "AddWifi",
    components: {
        ScreenHeader,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            form: {
                ssid: "",
                password: "",
            },
        };
    },
    computed: {
        currentStation(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
        canAdd(this: any) {
            return this.form.ssid.length > 0 && this.form.password.length > 0;
        },
    },
    mounted() {
        return this.$store.dispatch(ActionTypes.SCAN_STATION_NETWORKS, { deviceId: this.currentStation.deviceId }).then((networks) => {
            console.log("networks", networks);
            return {};
        });
    },
    methods: {
        onPageLoaded(args) {
            /*
            if (args.object.android) {
                args.object.android.setFitsSystemWindows(true);
            }
			*/
        },
        addNetwork(this: any) {
            const action = new AddStationNetworkAction(this.currentStation.deviceId, this.form.ssid, this.form.password);
            return this.$store.dispatch(action).then(
                () => {
                    return this.$navigateTo(routes.stations, {
                        props: {
                            stationId: this.stationId,
                        },
                    });
                },
                () => {
                    //
                }
            );
        },
        skip(this: any) {
            console.log("forward", this.form);
            return this.$navigateTo(routes.stations, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        onBack(this: any) {
            console.log("onBack");
            return this.$navigateTo(routes.onboarding.network, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        hideKeyboard(this: any, ev) {
            if (isAndroid) {
                utils.ad.dismissSoftInput();
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.text-field {
    //
}
.small {
    width: 50;
    margin: 20;
}
.skip {
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
    font-size: 14;
    font-weight: bold;
    text-align: center;
    margin: 10;
}
.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.gray-text {
    color: $fk-gray-hint;
}
.red-text {
    color: $fk-primary-red;
}
.field-container {
    padding: 20;
}
.wifi-help {
    margin: 20;
}
</style>
