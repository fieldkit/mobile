<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
                    <ScreenHeader :title="_L('endDeployment')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                    <GridLayout rows="*" columns="*">
                        <StackLayout row="0">
                            <StackLayout class="m-x-20 m-t-20" v-if="deployed">
                                <Label :text="_L('mustBeConnectedToStop')" class="size-18 m-y-5" lineHeight="4" textWrap="true" />
                                <StackLayout class="m-t-10" />
                                <Button
                                    class="btn btn-primary btn-padded full-width"
                                    :text="_L('stopRecording')"
                                    :isEnabled="station.connected"
                                    @tap="stopRecording"
                                ></Button>
                            </StackLayout>
                            <StackLayout v-else class="m-20">
                                <Label :text="station.name + ' ' + _L('notCurrentlyRecording')" textWrap="true" />
                            </StackLayout>
                        </StackLayout>
                    </GridLayout>
                </StackLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import * as dialogs from "tns-core-modules/ui/dialogs";
import routes from "../../routes";

import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";

import * as ActionTypes from "../../store/actions";

export default Vue.extend({
    data() {
        return {};
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    computed: {
        station(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
        deployed(this: any) {
            return this.$store.getters.legacyStations[this.stationId].deployStartTime !== null;
        },
    },
    methods: {
        onPageLoaded(this: any, args) {},
        goBack(this: any, event) {
            if (event) {
                // Change background color when pressed
                const cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            return this.$navigateTo(routes.stationSettings, {
                props: {
                    stationId: this.stationId,
                    station: this.station,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
        },
        stopRecording(this: any, event) {
            const station = this.$store.getters.legacyStations[this.stationId];
            return dialogs
                .confirm({
                    title: _L("areYouSureStopRecording"),
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel"),
                })
                .then((yes) => {
                    if (yes) {
                        return this.$store.dispatch(ActionTypes.END_STATION_DEPLOYMENT, { deviceId: station.deviceId });
                    }
                });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.full-width {
    width: 100%;
    margin-bottom: 10;
}
</style>
